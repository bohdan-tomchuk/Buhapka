import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/types/request-with-user.type';
import { ReceiptsService } from '../receipts/receipts.service';

@Controller('api/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly receiptsService: ReceiptsService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('receipt', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'), false);
        }
      },
    }),
  )
  async create(
    @Body() createExpenseDto: CreateExpenseDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    let receiptId: string | null = null;

    if (file) {
      try {
        const receipt = await this.receiptsService.uploadFile(file);
        receiptId = receipt.id;
      } catch (error) {
        // If receipt upload fails, expense creation should also fail
        throw error;
      }
    }

    try {
      return await this.expensesService.create(createExpenseDto, user.userId, receiptId);
    } catch (error) {
      // Rollback: delete the uploaded receipt if expense creation fails
      if (receiptId) {
        await this.receiptsService.deleteFile(receiptId).catch(() => {
          // Ignore cleanup errors
        });
      }
      throw error;
    }
  }

  @Get()
  findAll(
    @Query() filterDto: FilterExpenseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.findAll(filterDto, user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.expensesService.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.update(id, updateExpenseDto, user.userId);
  }

  @Post(':parentId/children')
  createChildExpense(
    @Param('parentId') parentId: string,
    @Body() createExpenseDto: CreateExpenseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.createChildExpense(
      parentId,
      createExpenseDto,
      user.userId,
    );
  }

  @Get(':id/with-children')
  getExpenseWithChildren(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.getExpenseWithChildren(id, user.userId);
  }
}
