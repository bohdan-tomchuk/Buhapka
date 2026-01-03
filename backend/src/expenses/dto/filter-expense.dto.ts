import { IsOptional, IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Category } from '../../common/enums/category.enum';
import { Source } from '../../common/enums/source.enum';

export class FilterExpenseDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @IsOptional()
  @IsEnum(Source)
  source?: Source;
}
