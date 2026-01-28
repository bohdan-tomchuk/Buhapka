import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/types/request-with-user.type';

@Controller('api/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('pdf')
  async generatePDF(
    @Body() dto: GenerateReportDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const dateFrom = new Date(dto.dateFrom);
    const dateTo = new Date(dto.dateTo);

    const pdf = await this.reportsService.generatePDF(
      dateFrom,
      dateTo,
      user.userId,
    );

    const filename = `report-${dto.dateFrom}-${dto.dateTo}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length,
    });

    res.status(HttpStatus.OK).send(pdf);
  }
}
