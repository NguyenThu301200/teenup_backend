import { IsString, IsInt, IsOptional, IsDateString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsInt()
  parentId!: number;
}
