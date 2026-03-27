import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const parent = await this.prisma.parent.findUnique({
      where: { id: dto.parentId },
    });
    if (!parent)
      throw new NotFoundException(`Parent #${dto.parentId} not found`);

    return this.prisma.student.create({
      data: {
        name: dto.name,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        parentId: dto.parentId,
      },
      include: { parent: true },
    });
  }

  async findAll() {
    return this.prisma.student.findMany({
      include: { parent: true, subscriptions: true },
    });
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        parent: true,
        subscriptions: true,
        classRegistrations: { include: { class: true } },
      },
    });
    if (!student) throw new NotFoundException(`Student #${id} not found`);
    return student;
  }

  async update(id: number, dto: UpdateStudentDto) {
    await this.findOne(id);
    if (dto.parentId) {
      const parent = await this.prisma.parent.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent)
        throw new NotFoundException(`Parent #${dto.parentId} not found`);
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      include: { parent: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.student.delete({ where: { id } });
  }
}
