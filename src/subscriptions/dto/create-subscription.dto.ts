import { IsInt, IsDateString, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @IsInt()
  studentId!: number;

  @IsInt()
  @Min(1)
  totalSessions!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
