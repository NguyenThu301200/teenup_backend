import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ParentsModule } from './parents/parents.module';
import { StudentsModule } from './students/students.module';
import { ClassesModule } from './classes/classes.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ClassRegistrationsModule } from './class-registrations/class-registrations.module';

@Module({
  imports: [
    PrismaModule,
    ParentsModule,
    StudentsModule,
    ClassesModule,
    SubscriptionsModule,
    ClassRegistrationsModule,
  ],
})
export class AppModule {}
