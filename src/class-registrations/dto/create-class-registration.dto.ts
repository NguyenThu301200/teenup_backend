import { IsInt, IsDateString } from 'class-validator';

export class CreateClassRegistrationDto {
  @IsInt()
  studentId!: number;

  @IsInt()
  classId!: number;

  @IsInt()
  subscriptionId!: number;

  @IsDateString()
  classDate!: string;
}
