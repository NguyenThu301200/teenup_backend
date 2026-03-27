import 'dotenv/config';
import { PrismaClient, DayOfWeek, SubscriptionStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.classRegistration.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.parent.deleteMany();

  // Create Parents
  const parent1 = await prisma.parent.create({
    data: {
      name: 'Nguyen Van A',
      email: 'nguyenvana@example.com',
      phone: '0901234567',
    },
  });

  const parent2 = await prisma.parent.create({
    data: {
      name: 'Tran Thi B',
      email: 'tranthib@example.com',
      phone: '0912345678',
    },
  });

  // Create Students
  const student1 = await prisma.student.create({
    data: {
      name: 'Nguyen Van C',
      dateOfBirth: new Date('2015-03-15'),
      parentId: parent1.id,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      name: 'Nguyen Thi D',
      dateOfBirth: new Date('2013-07-20'),
      parentId: parent1.id,
    },
  });

  const student3 = await prisma.student.create({
    data: {
      name: 'Tran Van E',
      dateOfBirth: new Date('2014-11-10'),
      parentId: parent2.id,
    },
  });

  // Create Classes
  const class1 = await prisma.class.create({
    data: {
      name: 'Lớp Toán Nâng Cao',
      description: 'Lớp toán nâng cao dành cho học sinh giỏi',
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '09:00',
      endTime: '10:30',
      maxStudents: 15,
    },
  });

  const class2 = await prisma.class.create({
    data: {
      name: 'Lớp Tiếng Anh Giao Tiếp',
      description: 'Luyện kỹ năng giao tiếp tiếng Anh',
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startTime: '14:00',
      endTime: '15:30',
      maxStudents: 10,
    },
  });

  const class3 = await prisma.class.create({
    data: {
      name: 'Lớp Vẽ Sáng Tạo',
      description: 'Phát triển tư duy sáng tạo qua hội họa',
      dayOfWeek: DayOfWeek.SATURDAY,
      startTime: '08:00',
      endTime: '09:30',
      maxStudents: 12,
    },
  });

  // Create Subscriptions
  const sub1 = await prisma.subscription.create({
    data: {
      studentId: student1.id,
      totalSessions: 10,
      remainingSessions: 10,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-06-30'),
      status: SubscriptionStatus.ACTIVE,
    },
  });

  const sub2 = await prisma.subscription.create({
    data: {
      studentId: student2.id,
      totalSessions: 8,
      remainingSessions: 8,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-05-31'),
      status: SubscriptionStatus.ACTIVE,
    },
  });

  const sub3 = await prisma.subscription.create({
    data: {
      studentId: student3.id,
      totalSessions: 12,
      remainingSessions: 12,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-08-31'),
      status: SubscriptionStatus.ACTIVE,
    },
  });

  console.log('Seed data created successfully!');
  console.log({
    parents: [parent1, parent2],
    students: [student1, student2, student3],
    classes: [class1, class2, class3],
    subscriptions: [sub1, sub2, sub3],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
