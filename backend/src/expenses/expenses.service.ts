import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import { Currency } from '../common/enums/currency.enum';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async create(
    createExpenseDto: CreateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const {
      amount,
      currency,
      exchange_rate,
      rate_date,
      date,
      source,
      category,
      description,
    } = createExpenseDto;

    let amountUah: number;
    let finalExchangeRate: number | null = null;
    let finalRateDate: Date | null = null;

    if (currency === Currency.UAH) {
      amountUah = amount;
    } else {
      if (!exchange_rate) {
        throw new Error('Exchange rate is required for non-UAH currencies');
      }
      amountUah = amount * exchange_rate;
      finalExchangeRate = exchange_rate;
      finalRateDate = rate_date ? new Date(rate_date) : null;
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
      .where('expense.user_id = :userId', { userId });

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
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const expense = await this.findOne(id, userId);

    if (
      updateExpenseDto.amount !== undefined ||
      updateExpenseDto.currency !== undefined ||
      updateExpenseDto.exchange_rate !== undefined
    ) {
      const finalAmount = updateExpenseDto.amount ?? expense.amount;
      const finalCurrency = updateExpenseDto.currency ?? expense.currency;
      const finalExchangeRate =
        updateExpenseDto.exchange_rate ?? expense.exchange_rate;

      if (finalCurrency === Currency.UAH) {
        expense.amount_uah = finalAmount;
        expense.exchange_rate = null;
        expense.rate_date = null;
      } else {
        if (!finalExchangeRate) {
          throw new Error('Exchange rate is required for non-UAH currencies');
        }
        expense.amount_uah = finalAmount * finalExchangeRate;
        expense.exchange_rate = finalExchangeRate;
        expense.rate_date = updateExpenseDto.rate_date
          ? new Date(updateExpenseDto.rate_date)
          : expense.rate_date;
      }

      if (updateExpenseDto.amount !== undefined)
        expense.amount = updateExpenseDto.amount;
      if (updateExpenseDto.currency !== undefined)
        expense.currency = updateExpenseDto.currency;
    }

    if (updateExpenseDto.date !== undefined) {
      expense.date = new Date(updateExpenseDto.date);
    }
    if (updateExpenseDto.source !== undefined) {
      expense.source = updateExpenseDto.source;
    }
    if (updateExpenseDto.category !== undefined) {
      expense.category = updateExpenseDto.category;
    }
    if (updateExpenseDto.description !== undefined) {
      expense.description = updateExpenseDto.description;
    }

    return this.expenseRepository.save(expense);
  }
}
