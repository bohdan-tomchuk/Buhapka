import { IsDateString } from 'class-validator';

export class GenerateReportDto {
  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;
}
