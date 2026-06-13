import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'http';
import { ApiErrorResponse } from '@repo/shared';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = this.getStatus(exception);
    const message = this.getMessage(exception);
    const details = this.getDetails(exception, message);

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : exception,
      );
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      message,
      statusCode: status,
      error: STATUS_CODES[status],
      path: request.url,
      ...(details ? { details } : {}),
    };

    response.status(status).json(errorResponse);
  }

  private getStatus(exception: unknown): number {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown): string {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (this.isRecord(response)) {
      if (typeof response.message === 'string') {
        return response.message;
      }

      if (this.isStringArray(response.message)) {
        return response.message[0] ?? 'Request failed';
      }

      if (typeof response.error === 'string') {
        return response.error;
      }
    }

    return 'Request failed';
  }

  private getDetails(exception: unknown, message: string): unknown {
    if (!(exception instanceof HttpException)) {
      return undefined;
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return undefined;
    }

    if (this.isRecord(response)) {
      const { message: responseMessage, ...details } = response;
      if (responseMessage === message && Object.keys(details).length === 0) {
        return undefined;
      }

      return details;
    }

    return undefined;
  }

  private isStringArray(value: unknown): value is string[] {
    return (
      Array.isArray(value) &&
      value.every((item): item is string => typeof item === 'string')
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
