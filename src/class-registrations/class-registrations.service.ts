import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassRegistrationDto } from './dto/create-class-registration.dto';
import { RegistrationStatus, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class ClassRegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClassRegistrationDto) {
    const { studentId, classId, subscriptionId, classDate } = dto;
    const classDateObj = new Date(classDate);

    // 1. Validate entities exist
    const [student, cls, subscription] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: studentId } }),
      this.prisma.class.findUnique({ where: { id: classId } }),
      this.prisma.subscription.findUnique({ where: { id: subscriptionId } }),
    ]);

    if (!student)
      throw new NotFoundException(`Student #${studentId} not found`);
    if (!cls) throw new NotFoundException(`Class #${classId} not found`);
    if (!subscription)
      throw new NotFoundException(`Subscription #${subscriptionId} not found`);

    // 2. Validate subscription belongs to this student
    if (subscription.studentId !== studentId) {
      throw new BadRequestException(
        'Subscription does not belong to this student',
      );
    }

    // 3. Check subscription is active and not expired
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is not active');
    }
    const now = new Date();
    if (now > subscription.endDate) {
      throw new BadRequestException('Subscription has expired');
    }

    // 4. Check remaining sessions
    if (subscription.remainingSessions <= 0) {
      throw new BadRequestException(
        'No remaining sessions in this subscription',
      );
    }

    // 5. Validate classDate matches the class's day of week
    const dayMap = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const classDateDay = dayMap[classDateObj.getUTCDay()];
    if (classDateDay !== cls.dayOfWeek) {
      throw new BadRequestException(
        `Class date ${classDate} is a ${classDateDay}, but this class runs on ${cls.dayOfWeek}`,
      );
    }

    // 6. Check class capacity (max_students)
    const currentRegistrations = await this.prisma.classRegistration.count({
      where: {
        classId,
        classDate: classDateObj,
        status: RegistrationStatus.REGISTERED,
      },
    });
    if (currentRegistrations >= cls.maxStudents) {
      throw new BadRequestException('Class is full (max students reached)');
    }

    // 7. Check schedule conflict: same student, same day, overlapping time
    const conflictingRegistrations =
      await this.prisma.classRegistration.findMany({
        where: {
          studentId,
          classDate: classDateObj,
          status: RegistrationStatus.REGISTERED,
        },
        include: { class: true },
      });

    for (const reg of conflictingRegistrations) {
      const existingStart = reg.class.startTime;
      const existingEnd = reg.class.endTime;
      // Check time overlap: newStart < existingEnd AND newEnd > existingStart
      if (cls.startTime < existingEnd && cls.endTime > existingStart) {
        throw new ConflictException(
          `Schedule conflict: Student is already registered for "${reg.class.name}" ` +
            `(${existingStart}-${existingEnd}) on this date`,
        );
      }
    }

    // 8. Create registration and deduct session in a transaction
    return this.prisma.$transaction(async (tx) => {
      const registration = await tx.classRegistration.create({
        data: {
          studentId,
          classId,
          subscriptionId,
          classDate: classDateObj,
          status: RegistrationStatus.REGISTERED,
        },
        include: { student: true, class: true, subscription: true },
      });

      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { remainingSessions: { decrement: 1 } },
      });

      return registration;
    });
  }

  async findAll(studentId?: number, classId?: number) {
    const where: { studentId?: number; classId?: number } = {};
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;

    return this.prisma.classRegistration.findMany({
      where,
      include: { student: true, class: true, subscription: true },
    });
  }

  async findOne(id: number) {
    const registration = await this.prisma.classRegistration.findUnique({
      where: { id },
      include: { student: true, class: true, subscription: true },
    });
    if (!registration)
      throw new NotFoundException(`Registration #${id} not found`);
    return registration;
  }

  async cancel(id: number) {
    const registration = await this.findOne(id);

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Registration is already cancelled');
    }

    // Calculate time difference between now and class start
    const classDateTime = new Date(registration.classDate);
    const [hours, minutes] = registration.class.startTime
      .split(':')
      .map(Number);
    classDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const hoursUntilClass =
      (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Cancellation logic: refund session if > 24 hours before class
    const shouldRefund = hoursUntilClass > 24;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.classRegistration.update({
        where: { id },
        data: {
          status: RegistrationStatus.CANCELLED,
          cancelledAt: now,
          isSessionRefunded: shouldRefund,
        },
        include: { student: true, class: true, subscription: true },
      });

      if (shouldRefund) {
        await tx.subscription.update({
          where: { id: registration.subscriptionId },
          data: { remainingSessions: { increment: 1 } },
        });
      }

      return {
        ...updated,
        refundMessage: shouldRefund
          ? 'Session refunded (cancelled more than 24 hours before class)'
          : 'No refund (cancelled less than 24 hours before class)',
      };
    });
  }
}
