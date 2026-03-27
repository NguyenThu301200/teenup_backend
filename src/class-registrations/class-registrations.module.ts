import { Module } from '@nestjs/common';
import { ClassRegistrationsController } from './class-registrations.controller';
import { ClassRegistrationsService } from './class-registrations.service';

@Module({
  controllers: [ClassRegistrationsController],
  providers: [ClassRegistrationsService],
})
export class ClassRegistrationsModule {}
