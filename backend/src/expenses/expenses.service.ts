import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
    receiptId?: string | null,
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
    } else {
      if (!exchange_rate) {
        throw new BadRequestException(
          'Exchange rate is required for non-UAH currencies',
        );
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

  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const expense = await this.findOne(id, userId);

    const {
      amount,
      currency,
      exchange_rate,
      rate_date,
      date,
      source,
      category,
      description,
    } = updateExpenseDto;

    if (
      amount !== undefined ||
      currency !== undefined ||
      exchange_rate !== undefined
    ) {
      const finalAmount: number =
        amount !== undefined ? (amount as number) : expense.amount;
      const finalCurrency: Currency =
        currency !== undefined ? (currency as Currency) : expense.currency;
      const finalExchangeRate: number | null =
        exchange_rate !== undefined
          ? (exchange_rate as number)
          : expense.exchange_rate;

      if (finalCurrency === Currency.UAH) {
        expense.amount_uah = finalAmount;
        expense.exchange_rate = null;
        expense.rate_date = null;
      } else {
        if (!finalExchangeRate) {
          throw new BadRequestException(
            'Exchange rate is required for non-UAH currencies',
          );
        }
        expense.amount_uah = finalAmount * finalExchangeRate;
        expense.exchange_rate = finalExchangeRate;
        if (rate_date !== undefined) {
          expense.rate_date = new Date(rate_date as string);
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
