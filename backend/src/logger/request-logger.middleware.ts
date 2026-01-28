import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const startTime = Date.now();

    // Log after response is finished
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      // Extract userId from request if authenticated
      const user = (req as { user?: { id?: string } }).user;
      const userId = user?.id;

      this.logger.logRequest(
        method,
        originalUrl,
        statusCode,
        responseTime,
        userId,
      );
    });

    next();
  }
}
