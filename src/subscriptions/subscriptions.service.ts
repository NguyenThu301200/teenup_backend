import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubscriptionDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student)
      throw new NotFoundException(`Student #${dto.studentId} not found`);

    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return this.prisma.subscription.create({
      data: {
        studentId: dto.studentId,
        totalSessions: dto.totalSessions,
        remainingSessions: dto.totalSessions,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: SubscriptionStatus.ACTIVE,
      },
      include: { student: true },
    });
  }

  async findAll() {
    return this.prisma.subscription.findMany({
      include: { student: true },
    });
  }

  async findOne(id: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        student: true,
        classRegistrations: { include: { class: true } },
      },
    });
    if (!subscription)
      throw new NotFoundException(`Subscription #${id} not found`);
    return subscription;
  }

  async findByStudent(studentId: number) {
    return this.prisma.subscription.findMany({
      where: { studentId, status: SubscriptionStatus.ACTIVE },
      include: { student: true },
    });
  }

  async cancel(id: number) {
    const subscription = await this.findOne(id);
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is not active');
    }
    return this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELLED },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.subscription.delete({ where: { id } });
  }
}
