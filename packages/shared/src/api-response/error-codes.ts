/**
 * Stable, machine-readable error codes returned in `ApiErrorResponse.code`.
 *
 * Messages are for people and may change; codes are for code. Clients should
 * branch on `code`, never on `message`.
 *
 * Generic codes are derived from the HTTP status by the API's exception
 * filter. Domain codes are attached explicitly where a client may want to
 * react to a specific business rule:
 *
 *   throw new ConflictException({
 *     message: 'An active month already exists',
 *     code: ErrorCode.MONTH_ALREADY_ACTIVE,
 *   });
 */
export const ErrorCode = {
  // Generic (derived from HTTP status)
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // Database (mapped from Prisma errors)
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  RELATED_RESOURCE_MISSING: "RELATED_RESOURCE_MISSING",

  // Client-side only (never sent by the API)
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",

  // Auth
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_IN_USE: "EMAIL_IN_USE",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Mess & membership
  NOT_MESS_MEMBER: "NOT_MESS_MEMBER",
  NO_ACTIVE_MESS: "NO_ACTIVE_MESS",
  MANAGER_ONLY: "MANAGER_ONLY",
  ALREADY_MEMBER: "ALREADY_MEMBER",
  MEMBER_PREVIOUSLY_REMOVED: "MEMBER_PREVIOUSLY_REMOVED",
  INVITE_ALREADY_PENDING: "INVITE_ALREADY_PENDING",

  // Months & accounting
  MONTH_ALREADY_ACTIVE: "MONTH_ALREADY_ACTIVE",
  MONTH_ALREADY_CLOSED: "MONTH_ALREADY_CLOSED",
  NO_ACTIVE_MONTH: "NO_ACTIVE_MONTH",
  EXPENSE_LOCKED: "EXPENSE_LOCKED",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Default code for an HTTP status when no explicit code was given. */
export function errorCodeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 413:
      return ErrorCode.PAYLOAD_TOO_LARGE;
    case 429:
      return ErrorCode.RATE_LIMITED;
    case 502:
    case 503:
    case 504:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
  }
}
