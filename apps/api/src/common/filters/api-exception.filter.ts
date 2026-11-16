import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';
import { STATUS_CODES } from 'http';
import { ApiErrorResponse, ErrorCode, errorCodeForStatus } from '@repo/shared';
import { mapPrismaError } from '../errors/prisma-error.mapper';
import {
  REQUEST_ID_HEADER,
  RequestWithId,
  resolveRequestId,
} from '../request-id/request-id.middleware';

interface NormalizedError {
  status: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

const KNOWN_CODES = new Set<string>(Object.values(ErrorCode));
const INTERNAL_MESSAGE = 'Something went wrong on our side. Please try again.';

/**
 * Turns every thrown value into the `ApiErrorResponse` envelope:
 * - `HttpException`s keep their status and message; an explicit `code` in the
 *   exception body is passed through.
 * - Prisma / database errors are mapped to 4xx/503 instead of a blind 500.
 * - Express body-parser errors (bad JSON, too large) become 400/413.
 * - Anything else is a 500 with a generic message; the real error is logged
 *   with the request id and never sent to the client.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithId>();
    const requestId = resolveRequestId(request);
    const normalized = this.normalize(exception);

    if (normalized.status >= 500) {
      this.logServerError(exception, normalized, request, requestId);
    }

    if (response.headersSent) return;

    const body: ApiErrorResponse = {
      success: false,
      message: normalized.message,
      statusCode: normalized.status,
      code: normalized.code,
      error: STATUS_CODES[normalized.status],
      path: request.url,
      requestId,
      ...(normalized.details ? { details: normalized.details } : {}),
    };

    response.setHeader(REQUEST_ID_HEADER, requestId);
    response.status(normalized.status).json(body);
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ErrorCode.RATE_LIMITED,
        message: 'Too many requests. Please wait a moment and try again.',
      };
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    const mapped = mapPrismaError(exception);
    if (mapped) return mapped;

    const httpError = this.fromHttpErrorsLike(exception);
    if (httpError) return httpError;

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: INTERNAL_MESSAGE,
    };
  }

  private fromHttpException(exception: HttpException): NormalizedError {
    const status = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        status,
        code: errorCodeForStatus(status),
        message: status >= 500 ? INTERNAL_MESSAGE : response,
      };
    }

    const body: Record<string, unknown> = this.isRecord(response)
      ? response
      : {};
    const rawMessage = body.message;
    const rawCode = body.code;
    const rawError = body.error;
    const rest: Record<string, unknown> = { ...body };
    delete rest.message;
    delete rest.code;
    delete rest.error;
    delete rest.statusCode;

    let message = 'Request failed';
    if (typeof rawMessage === 'string') {
      message = rawMessage;
    } else if (this.isStringArray(rawMessage)) {
      // class-validator style: keep the first as the headline, all as details
      message = rawMessage[0] ?? message;
      if (rawMessage.length > 1) rest.messages = rawMessage;
    } else if (typeof rawError === 'string') {
      message = rawError;
    }

    // `throw new BadRequestException({ message, details })` → expose
    // `details` directly rather than as `details.details`.
    const restKeys = Object.keys(rest);
    const details =
      restKeys.length === 0
        ? undefined
        : restKeys.length === 1 && restKeys[0] === 'details'
          ? rest.details
          : rest;

    let code: ErrorCode;
    if (typeof rawCode === 'string' && KNOWN_CODES.has(rawCode)) {
      code = rawCode as ErrorCode;
    } else if (
      status === 400 &&
      (details || message === 'Validation failed' || Array.isArray(rawMessage))
    ) {
      code = ErrorCode.VALIDATION_FAILED;
    } else {
      code = errorCodeForStatus(status);
    }

    return {
      status,
      code,
      message: status >= 500 ? INTERNAL_MESSAGE : message,
      details: status >= 500 ? undefined : details,
    };
  }

  /** Errors from Express middleware (body-parser) follow `http-errors`. */
  private fromHttpErrorsLike(exception: unknown): NormalizedError | null {
    if (!this.isRecord(exception) || exception.expose !== true) return null;
    const status =
      typeof exception.status === 'number'
        ? exception.status
        : typeof exception.statusCode === 'number'
          ? exception.statusCode
          : null;
    if (!status || status < 400 || status >= 500) return null;

    let message =
      typeof exception.message === 'string'
        ? exception.message
        : 'Request failed';
    if (exception.type === 'entity.parse.failed') {
      message = 'The request body is not valid JSON.';
    } else if (exception.type === 'entity.too.large') {
      message = 'The request is too large.';
    }

    return { status, code: errorCodeForStatus(status), message };
  }

  /**
   * Single-line JSON so it is searchable in Vercel/host logs by requestId.
   * Uses console directly: the Nest logger is disabled in production.
   */
  private logServerError(
    exception: unknown,
    normalized: NormalizedError,
    request: RequestWithId,
    requestId: string,
  ) {
    const user = (request as { user?: { id?: string } }).user;
    const error =
      exception instanceof Error
        ? {
            name: exception.name,
            message: exception.message,
            stack: exception.stack,
            ...(this.isRecord(exception) && typeof exception.code === 'string'
              ? { code: exception.code }
              : {}),
          }
        : { value: String(exception) };

    console.error(
      JSON.stringify({
        level: 'error',
        time: new Date().toISOString(),
        requestId,
        method: request.method,
        path: request.originalUrl ?? request.url,
        status: normalized.status,
        code: normalized.code,
        userId: user?.id,
        error,
      }),
    );
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
