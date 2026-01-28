import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { subDays, format } from 'date-fns';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { Currency } from '../common/enums/currency.enum';
import { ExchangeRateSource } from '../common/enums/exchange-rate-source.enum';

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);
  private readonly MAX_RECURSION_DEPTH = 10;

  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRatesRepository: Repository<ExchangeRate>,
  ) {}

  async findOne(currency: Currency, date: Date): Promise<ExchangeRate | null> {
    return this.exchangeRatesRepository.findOne({
      where: { currency, date },
    });
  }

  async saveRate(
    currency: Currency,
    date: Date,
    rate: number,
    source: ExchangeRateSource,
  ): Promise<ExchangeRate> {
    const exchangeRate = this.exchangeRatesRepository.create({
      currency,
      date,
      rate,
      source,
    });
    return this.exchangeRatesRepository.save(exchangeRate);
  }

  async getRate(
    currency: Currency,
    date: Date,
    depth: number = 0,
  ): Promise<ExchangeRate> {
    // Check recursion depth limit to prevent infinite loops
    if (depth >= this.MAX_RECURSION_DEPTH) {
      throw new Error(
        `Could not fetch exchange rate for ${currency} after ${this.MAX_RECURSION_DEPTH} attempts`,
      );
    }

    // 1. Check cache in DB
    const cached = await this.findOne(currency, date);
    if (cached) {
      this.logger.log(
        `Found cached rate for ${currency} on ${format(date, 'yyyy-MM-dd')}: ${cached.rate} (source: ${cached.source})`,
      );
      return cached;
    }

    // 2. Try NBU API
    try {
      const rate = await this.fetchFromNBU(currency, date);
      if (rate) {
        this.logger.log(
          `Fetched rate from NBU for ${currency} on ${format(date, 'yyyy-MM-dd')}: ${rate}`,
        );
        return await this.saveRate(
          currency,
          date,
          rate,
          ExchangeRateSource.NBU,
        );
      }
    } catch (error) {
      this.logger.error(`NBU API failed for ${currency} on ${format(date, 'yyyy-MM-dd')}:`, error.message);
    }

    // 3. Fallback to PrivatBank
    try {
      const rate = await this.fetchFromPrivatBank(currency, date);
      if (rate) {
        this.logger.log(
          `Fetched rate from PrivatBank for ${currency} on ${format(date, 'yyyy-MM-dd')}: ${rate}`,
        );
        return await this.saveRate(
          currency,
          date,
          rate,
          ExchangeRateSource.PRIVATBANK,
        );
      }
    } catch (error) {
      this.logger.error(
        `PrivatBank API failed for ${currency} on ${format(date, 'yyyy-MM-dd')}:`,
        error.message,
      );
    }

    // 4. If weekend/holiday (empty response), try previous day recursively
    this.logger.log(
      `No rate available for ${currency} on ${format(date, 'yyyy-MM-dd')}, trying previous day (depth: ${depth + 1})`,
    );
    const previousDay = subDays(date, 1);
    return this.getRate(currency, previousDay, depth + 1);
  }

  private async fetchFromNBU(
    currency: Currency,
    date: Date,
  ): Promise<number | null> {
    const formattedDate = format(date, 'yyyyMMdd');
    const url = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${currency}&date=${formattedDate}&json`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NBU API returned status ${response.status}`);
    }

    const data = await response.json();
    return data[0]?.rate || null;
  }

  private async fetchFromPrivatBank(
    currency: Currency,
    date: Date,
  ): Promise<number | null> {
    const formattedDate = format(date, 'dd.MM.yyyy');
    const url = `https://api.privatbank.ua/p24api/exchange_rates?json&date=${formattedDate}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`PrivatBank API returned status ${response.status}`);
    }

    const data = await response.json();
    const exchangeRate = data.exchangeRate?.find(
      (r: any) => r.currency === currency,
    );
    return exchangeRate?.saleRateNB || null;
  }
}
