import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ClassRegistrationsService } from './class-registrations.service';
import { CreateClassRegistrationDto } from './dto/create-class-registration.dto';

@Controller('class-registrations')
export class ClassRegistrationsController {
  constructor(
    private readonly classRegistrationsService: ClassRegistrationsService,
  ) {}

  @Post()
  create(@Body() dto: CreateClassRegistrationDto) {
    return this.classRegistrationsService.create(dto);
  }

  @Get()
  findAll(
    @Query('studentId') studentId?: number,
    @Query('classId') classId?: number,
  ) {
    return this.classRegistrationsService.findAll(
      studentId ?? undefined,
      classId ?? undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.classRegistrationsService.findOne(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.classRegistrationsService.cancel(id);
  }
}
