import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const logDir = join(process.cwd(), 'logs');
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      isDevelopment
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, context, stack }) => {
                const contextString = context ? `[${String(context)}] ` : '';
                const stackString = stack ? `\n${String(stack)}` : '';
                return `${String(timestamp)} ${String(level)} ${contextString}${String(message)}${stackString}`;
              },
            ),
          )
        : winston.format.json(),
    );

    // Configure transports
    const transports: winston.transport[] = [
      new winston.transports.Console({
        level: isDevelopment ? 'debug' : 'info',
        format: logFormat,
      }),
    ];

    // Add file transports only in production or when explicitly enabled
    if (!isDevelopment || process.env.ENABLE_FILE_LOGGING === 'true') {
      // Combined logs (all levels)
      transports.push(
        new DailyRotateFile({
          dirname: logDir,
          filename: 'combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info',
          format: winston.format.json(),
        }),
      );

      // Error logs only
      transports.push(
        new DailyRotateFile({
          dirname: logDir,
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: winston.format.json(),
        }),
      );
    }

    this.logger = winston.createLogger({
      transports,
      exceptionHandlers: [
        new winston.transports.Console({
          format: logFormat,
        }),
      ],
      rejectionHandlers: [
        new winston.transports.Console({
          format: logFormat,
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, stack: trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Additional methods for structured logging
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
  ) {
    this.logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime,
      userId,
      type: 'http',
    });
  }

  logException(error: Error, context?: string) {
    this.logger.error('Unhandled Exception', {
      message: error.message,
      stack: error.stack,
      context,
      type: 'exception',
    });
  }
}
