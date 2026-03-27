import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { DayOfWeek } from '@prisma/client';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClassDto) {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
    return this.prisma.class.create({ data: dto });
  }

  async findAll(dayOfWeek?: DayOfWeek) {
    const where = dayOfWeek ? { dayOfWeek } : {};
    return this.prisma.class.findMany({
      where,
      include: {
        classRegistrations: {
          where: { status: 'REGISTERED' },
          select: { id: true, studentId: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        classRegistrations: {
          where: { status: 'REGISTERED' },
          include: { student: true },
        },
      },
    });
    if (!cls) throw new NotFoundException(`Class #${id} not found`);
    return cls;
  }

  async update(id: number, dto: UpdateClassDto) {
    const existing = await this.findOne(id);
    const startTime = dto.startTime ?? existing.startTime;
    const endTime = dto.endTime ?? existing.endTime;
    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
    return this.prisma.class.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.class.delete({ where: { id } });
  }
}
