import { IsNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { Currency } from '../../common/enums/currency.enum';

export class GetExchangeRateDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;
}
