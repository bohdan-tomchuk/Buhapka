import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsDateString,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';
import { Currency } from '../../common/enums/currency.enum';
import { Source } from '../../common/enums/source.enum';
import { Category } from '../../common/enums/category.enum';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  exchange_rate?: number;

  @IsOptional()
  @IsDateString()
  rate_date?: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsEnum(Source)
  source: Source;

  @IsNotEmpty()
  @IsEnum(Category)
  category: Category;

  @IsNotEmpty()
  @IsString()
  description: string;
}
