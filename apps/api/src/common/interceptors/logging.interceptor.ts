import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = req;
    const userAgent = req.get('user-agent') ?? '';
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = res;
        const duration = Date.now() - now;
        const log = `${method} ${url} ${statusCode} ${duration}ms - ${ip} - ${userAgent}`;

        if (statusCode >= 500) {
          this.logger.error(`❌ ${log}`);
        } else if (statusCode >= 400) {
          this.logger.warn(`⚠️ ${log}`);
        } else {
          this.logger.log(`✅ ${log}`);
        }
      }),
    );
  }
}
