import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExchangeRatesService } from './exchange-rates.service';
import { GetExchangeRateDto } from './dto/get-exchange-rate.dto';
import { Currency } from '../common/enums/currency.enum';

@Controller('exchange-rates')
@UseGuards(JwtAuthGuard)
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get()
  async getExchangeRate(@Query() query: GetExchangeRateDto) {
    try {
      // Parse date string to Date object
      const date = new Date(query.date);

      // Validate date
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      // Validate currency enum
      if (!Object.values(Currency).includes(query.currency)) {
        throw new BadRequestException('Invalid currency');
      }

      // Get exchange rate
      const exchangeRate = await this.exchangeRatesService.getRate(
        query.currency,
        date,
      );

      return exchangeRate;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Could not fetch exchange rate: ${error.message}`,
      );
    }
  }
}
