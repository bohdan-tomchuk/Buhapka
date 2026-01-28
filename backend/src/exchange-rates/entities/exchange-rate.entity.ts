import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';
import { Currency } from '../../common/enums/currency.enum';
import { ExchangeRateSource } from '../../common/enums/exchange-rate-source.enum';

@Entity('exchange_rates')
@Unique(['currency', 'date'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Column('decimal', { precision: 10, scale: 4 })
  rate: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'enum', enum: ExchangeRateSource })
  source: ExchangeRateSource;
}
