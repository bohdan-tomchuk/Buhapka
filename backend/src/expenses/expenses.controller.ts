import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto, @Req() req: any) {
    return this.expensesService.create(createExpenseDto, req.user.userId);
  }

  @Get()
  findAll(@Query() filterDto: FilterExpenseDto, @Req() req: any) {
    return this.expensesService.findAll(filterDto, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.expensesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Req() req: any,
  ) {
    return this.expensesService.update(id, updateExpenseDto, req.user.userId);
  }
}
