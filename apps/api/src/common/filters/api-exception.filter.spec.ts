import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ErrorCode } from '@repo/shared';
import { ApiExceptionFilter } from './api-exception.filter';

function prismaError(name: string, code?: string, meta?: unknown) {
  return Object.assign(new Error('prisma failure'), { name, code, meta });
}

function run(exception: unknown, requestId = 'req-test-0001') {
  const json = jest.fn();
  const response = {
    headersSent: false,
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json,
  };
  const request = {
    url: '/test',
    originalUrl: '/test',
    method: 'GET',
    headers: { 'x-request-id': requestId },
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  new ApiExceptionFilter().catch(exception, host);
  return {
    status: (response.status.mock.calls[0] as [number])[0],
    body: (json.mock.calls[0] as [Record<string, unknown>])[0],
    response,
  };
}

describe('ApiExceptionFilter', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('passes through an explicit domain code', () => {
    const { status, body } = run(
      new ConflictException({
        message: 'Month closed',
        code: ErrorCode.MONTH_ALREADY_CLOSED,
      }),
    );
    expect(status).toBe(409);
    expect(body).toMatchObject({
      success: false,
      message: 'Month closed',
      code: ErrorCode.MONTH_ALREADY_CLOSED,
      requestId: 'req-test-0001',
    });
    expect(body.details).toBeUndefined();
  });

  it('derives the code from the status when none is given', () => {
    const { body } = run(new ForbiddenException('Nope'));
    expect(body).toMatchObject({ code: ErrorCode.FORBIDDEN, message: 'Nope' });
  });

  it('flattens validation details and marks VALIDATION_FAILED', () => {
    const { status, body } = run(
      new BadRequestException({
        message: 'Validation failed',
        details: { email: 'Invalid email' },
      }),
    );
    expect(status).toBe(400);
    expect(body.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(body.details).toEqual({ email: 'Invalid email' });
  });

  it('keeps all class-validator messages', () => {
    const { body } = run(new BadRequestException(['a is bad', 'b is bad']));
    expect(body.message).toBe('a is bad');
    expect(body.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(body.details).toEqual({ messages: ['a is bad', 'b is bad'] });
  });

  it('maps rate limiting to RATE_LIMITED', () => {
    const { status, body } = run(new ThrottlerException());
    expect(status).toBe(429);
    expect(body.code).toBe(ErrorCode.RATE_LIMITED);
  });

  it('maps a Prisma unique violation to 409', () => {
    const { status, body } = run(
      prismaError('PrismaClientKnownRequestError', 'P2002', {
        target: ['email'],
      }),
    );
    expect(status).toBe(409);
    expect(body.code).toBe(ErrorCode.DUPLICATE_RESOURCE);
    expect(body.details).toEqual({ fields: ['email'] });
  });

  it('maps a Prisma record-not-found to 404', () => {
    const { status } = run(
      prismaError('PrismaClientKnownRequestError', 'P2025'),
    );
    expect(status).toBe(404);
  });

  it('maps an unreachable database to 503 and logs it', () => {
    const { status, body } = run(
      prismaError('PrismaClientInitializationError'),
    );
    expect(status).toBe(503);
    expect(body.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it('hides unknown errors behind a generic 500 and logs the real one', () => {
    const { status, body, response } = run(
      new Error('secret connection string leaked'),
    );
    expect(status).toBe(500);
    expect(body.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      'req-test-0001',
    );

    const logged = JSON.parse(
      (consoleError.mock.calls[0] as [string])[0],
    ) as Record<string, unknown>;
    expect(logged).toMatchObject({
      level: 'error',
      requestId: 'req-test-0001',
      status: 500,
    });
  });

  it('never exposes the message of a thrown 5xx HttpException', () => {
    const { body } = run(new InternalServerErrorException('db password=x'));
    expect(body.message).not.toContain('password');
  });

  it('replaces an unsafe incoming request id', () => {
    const { body } = run(new ForbiddenException(), 'bad id <script>');
    expect(body.requestId).not.toBe('bad id <script>');
    expect(typeof body.requestId).toBe('string');
  });
});
