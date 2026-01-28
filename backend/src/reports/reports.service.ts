import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { ExpensesService } from '../expenses/expenses.service';
import { Expense } from '../expenses/entities/expense.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly expensesService: ExpensesService) {}

  async generatePDF(
    dateFrom: Date,
    dateTo: Date,
    userId: string,
  ): Promise<Buffer> {
    this.logger.log(
      `Generating PDF report for user ${userId} from ${dateFrom.toISOString()} to ${dateTo.toISOString()}`,
    );

    const expenses = await this.expensesService.findByDateRange(
      dateFrom,
      dateTo,
      userId,
    );

    const totalUah = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount_uah),
      0,
    );

    const html = this.generateHTMLTemplate(expenses, totalUah, dateFrom, dateTo);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });

      this.logger.log(`PDF generated successfully with ${expenses.length} expenses`);

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generateHTMLTemplate(
    expenses: Expense[],
    total: number,
    dateFrom: Date,
    dateTo: Date,
  ): string {
    const formatDate = (date: Date): string => {
      return new Date(date).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    };

    const expenseRows = expenses
      .map(
        (e) => `
          <tr>
            <td>${formatDate(e.date)}</td>
            <td>${e.description || '-'}</td>
            <td>${Number(e.amount).toFixed(2)} ${e.currency}${e.currency !== 'UAH' ? ` (${Number(e.amount_uah).toFixed(2)} UAH)` : ''}</td>
            <td>${e.receipt_id ? '✓' : '✗'}</td>
          </tr>
        `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            margin: 40px;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
          }
          .period {
            color: #666;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .total {
            font-weight: bold;
            text-align: right;
            font-size: 18px;
            color: #333;
          }
          .empty-state {
            text-align: center;
            padding: 40px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <h1>Звіт про витрати</h1>
        <p class="period">Період: ${formatDate(dateFrom)} - ${formatDate(dateTo)}</p>
        ${
          expenses.length > 0
            ? `
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Опис</th>
              <th>Сума</th>
              <th>Чек</th>
            </tr>
          </thead>
          <tbody>
            ${expenseRows}
          </tbody>
        </table>
        <p class="total">Загальна сума: ${total.toFixed(2)} UAH</p>
        `
            : `
        <div class="empty-state">
          <p>Немає витрат за вказаний період</p>
        </div>
        `
        }
      </body>
      </html>
    `;
  }
}
