import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@repo/shared';

export interface MappedError {
  status: number;
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

type PrismaLikeError = {
  name?: unknown;
  code?: unknown;
  errorCode?: unknown;
  meta?: unknown;
  message?: unknown;
};

// Codes meaning "the database could not be reached or is overloaded".
const UNAVAILABLE_CODES = new Set([
  'P1001', // can't reach database server
  'P1002', // database server timed out
  'P1008', // operations timed out
  'P1017', // server closed the connection
  'P2024', // timed out fetching a connection from the pool
  'P2028', // transaction API error (usually a transaction timeout)
]);

// Low-level network failures surfaced by the Neon driver.
const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
]);

const UNAVAILABLE: Omit<MappedError, 'code'> = {
  status: HttpStatus.SERVICE_UNAVAILABLE,
  message:
    'The service is temporarily unavailable. Please try again in a moment.',
};

function fieldsFromMeta(meta: unknown): string[] | undefined {
  if (!meta || typeof meta !== 'object') return undefined;
  const target = (meta as Record<string, unknown>).target;
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === 'string') return [target];
  return undefined;
}

/**
 * Translate a Prisma / database driver error into an HTTP-friendly shape.
 * Returns `null` when the error is not database-related.
 *
 * Duck-typed on `name`/`code` rather than `instanceof` so it keeps working
 * across duplicated `@prisma/client` copies in the monorepo.
 */
export function mapPrismaError(exception: unknown): MappedError | null {
  if (!exception || typeof exception !== 'object') return null;
  const error = exception as PrismaLikeError;
  const name = typeof error.name === 'string' ? error.name : '';
  const code =
    typeof error.code === 'string'
      ? error.code
      : typeof error.errorCode === 'string'
        ? error.errorCode
        : '';

  if (
    name === 'PrismaClientInitializationError' ||
    UNAVAILABLE_CODES.has(code) ||
    NETWORK_ERROR_CODES.has(code)
  ) {
    return { ...UNAVAILABLE, code: ErrorCode.SERVICE_UNAVAILABLE };
  }

  if (name !== 'PrismaClientKnownRequestError' || !/^P\d{4}$/.test(code)) {
    return null;
  }

  switch (code) {
    case 'P2002': {
      const fields = fieldsFromMeta(error.meta);
      return {
        status: HttpStatus.CONFLICT,
        code: ErrorCode.DUPLICATE_RESOURCE,
        message: 'A record with these details already exists.',
        ...(fields ? { details: { fields } } : {}),
      };
    }
    case 'P2025':
    case 'P2001':
    case 'P2015':
      return {
        status: HttpStatus.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: 'The requested record was not found.',
      };
    case 'P2003':
    case 'P2014':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.RELATED_RESOURCE_MISSING,
        message: 'A related record does not exist or is still in use.',
      };
    case 'P2000':
    case 'P2005':
    case 'P2006':
    case 'P2007':
    case 'P2011':
    case 'P2012':
    case 'P2023':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Some of the submitted values are invalid.',
      };
    case 'P2034':
      return {
        status: HttpStatus.CONFLICT,
        code: ErrorCode.CONFLICT,
        message:
          'This record was changed by someone else at the same time. Please try again.',
      };
    default:
      return null;
  }
}
