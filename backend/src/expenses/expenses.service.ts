import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import { Currency } from '../common/enums/currency.enum';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  async create(
    createExpenseDto: CreateExpenseDto,
    userId: string,
    receiptId?: string | null,
  ): Promise<Expense> {
    const {
      amount,
      currency,
      date,
      source,
      category,
      description,
      parent_expense_id,
    } = createExpenseDto;

    if (parent_expense_id) {
      const parentExpense = await this.expenseRepository.findOne({
        where: { id: parent_expense_id, user_id: userId },
      });
      if (!parentExpense) {
        throw new NotFoundException(
          `Parent expense with ID ${parent_expense_id} not found`,
        );
      }
    }

    let amountUah: number;
    let finalExchangeRate: number | null = null;
    let finalRateDate: Date | null = null;

    if (currency === Currency.UAH) {
      amountUah = amount;
      this.logger.log(`Creating UAH expense, amount_uah = ${amountUah}`);
    } else {
      try {
        const expenseDate = new Date(date);
        const rate = await this.exchangeRatesService.getRate(currency, expenseDate);
        finalExchangeRate = rate.rate;
        finalRateDate = rate.date;
        amountUah = amount * finalExchangeRate;

        this.logger.log(
          `Fetched exchange rate for ${currency} on ${date}: ${finalExchangeRate} (source: ${rate.source}), amount_uah = ${amountUah}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to fetch exchange rate for ${currency} on ${date}:`,
          error.message,
        );
        throw new BadRequestException(
          `Could not fetch exchange rate for ${currency} on ${date}`,
        );
      }
    }

    const expense = this.expenseRepository.create({
      amount,
      currency,
      exchange_rate: finalExchangeRate,
      rate_date: finalRateDate,
      amount_uah: amountUah,
      user_id: userId,
      date: new Date(date),
      source,
      category,
      description,
      parent_expense_id: parent_expense_id || null,
      receipt_id: receiptId || null,
    });

    return this.expenseRepository.save(expense);
  }

  async findAll(
    filterDto: FilterExpenseDto,
    userId: string,
  ): Promise<{ data: Expense[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 20,
      dateFrom,
      dateTo,
      category,
      source,
    } = filterDto;

    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.children', 'children')
      .leftJoinAndSelect('children.children', 'grandchildren')
      .where('expense.user_id = :userId', { userId })
      .andWhere('expense.parent_expense_id IS NULL');

    if (dateFrom) {
      queryBuilder.andWhere('expense.date >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('expense.date <= :dateTo', { dateTo });
    }

    if (category) {
      queryBuilder.andWhere('expense.category = :category', { category });
    }

    if (source) {
      queryBuilder.andWhere('expense.source = :source', { source });
    }

    const [data, total] = await queryBuilder
      .orderBy('expense.date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, userId: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, user_id: userId },
      relations: ['children', 'children.children'],
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async getExpenseWithChildren(id: string, userId: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, user_id: userId },
      relations: ['children', 'children.children', 'children.children.children'],
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async createChildExpense(
    parentId: string,
    createExpenseDto: CreateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const parentExpense = await this.expenseRepository.findOne({
      where: { id: parentId, user_id: userId },
    });

    if (!parentExpense) {
      throw new NotFoundException(
        `Parent expense with ID ${parentId} not found`,
      );
    }

    const childExpenseDto = {
      ...createExpenseDto,
      parent_expense_id: parentId,
    };

    return this.create(childExpenseDto, userId);
  }

  async findByDateRange(
    dateFrom: Date,
    dateTo: Date,
    userId: string,
  ): Promise<Expense[]> {
    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.receipt', 'receipt')
      .where('expense.user_id = :userId', { userId })
      .andWhere('expense.date >= :dateFrom', { dateFrom })
      .andWhere('expense.date <= :dateTo', { dateTo })
      .orderBy('expense.date', 'ASC');

    return queryBuilder.getMany();
  }

  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const expense = await this.findOne(id, userId);

    const {
      amount,
      currency,
      date,
      source,
      category,
      description,
    } = updateExpenseDto;

    // Determine if we need to recalculate exchange rate
    const currencyChanged = currency !== undefined && currency !== expense.currency;
    const dateChanged = date !== undefined && date !== expense.date.toISOString().split('T')[0];
    const amountChanged = amount !== undefined;

    if (currencyChanged || dateChanged || amountChanged) {
      const finalAmount: number =
        amount !== undefined ? (amount as number) : expense.amount;
      const finalCurrency: Currency =
        currency !== undefined ? (currency as Currency) : expense.currency;
      const finalDate = date !== undefined ? new Date(date as string) : expense.date;

      if (finalCurrency === Currency.UAH) {
        expense.amount_uah = finalAmount;
        expense.exchange_rate = null;
        expense.rate_date = null;
        this.logger.log(`Updating to UAH expense, amount_uah = ${expense.amount_uah}`);
      } else {
        // Fetch new rate if currency or date changed
        if (currencyChanged || dateChanged) {
          try {
            const rate = await this.exchangeRatesService.getRate(finalCurrency, finalDate);
            expense.exchange_rate = rate.rate;
            expense.rate_date = rate.date;
            expense.amount_uah = finalAmount * rate.rate;

            this.logger.log(
              `Fetched new exchange rate for ${finalCurrency} on ${finalDate.toISOString().split('T')[0]}: ${rate.rate} (source: ${rate.source})`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to fetch exchange rate for ${finalCurrency} on ${finalDate.toISOString().split('T')[0]}:`,
              error.message,
            );
            throw new BadRequestException(
              `Could not fetch exchange rate for ${finalCurrency} on ${finalDate.toISOString().split('T')[0]}`,
            );
          }
        } else {
          // Just recalculate with existing rate
          if (!expense.exchange_rate) {
            throw new BadRequestException(
              'Exchange rate is required for non-UAH currencies',
            );
          }
          expense.amount_uah = finalAmount * expense.exchange_rate;
        }
      }

      if (amount !== undefined) {
        expense.amount = amount as number;
      }
      if (currency !== undefined) {
        expense.currency = currency as Currency;
      }
    }

    if (date !== undefined) {
      expense.date = new Date(date as string);
    }
    if (source !== undefined) {
      expense.source = source as typeof expense.source;
    }
    if (category !== undefined) {
      expense.category = category as typeof expense.category;
    }
    if (description !== undefined) {
      expense.description = description as string;
    }

    return this.expenseRepository.save(expense);
  }
}
