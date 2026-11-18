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
  CURRENT_PASSWORD_INCORRECT: "CURRENT_PASSWORD_INCORRECT",
  /** Google-only account: there is no password to sign in with or change. */
  PASSWORD_NOT_SET: "PASSWORD_NOT_SET",
  USER_NOT_FOUND: "USER_NOT_FOUND",

  // Requests
  NO_CHANGES: "NO_CHANGES",
  FILE_REQUIRED: "FILE_REQUIRED",

  // Mess & membership
  NOT_MESS_MEMBER: "NOT_MESS_MEMBER",
  NO_ACTIVE_MESS: "NO_ACTIVE_MESS",
  MANAGER_ONLY: "MANAGER_ONLY",
  ALREADY_MEMBER: "ALREADY_MEMBER",
  /** ADR-003: a user can be in only one active mess. */
  ALREADY_IN_MESS: "ALREADY_IN_MESS",
  MEMBER_PREVIOUSLY_REMOVED: "MEMBER_PREVIOUSLY_REMOVED",
  INVITE_ALREADY_PENDING: "INVITE_ALREADY_PENDING",
  INVITE_NOT_FOUND: "INVITE_NOT_FOUND",
  MESS_NOT_FOUND: "MESS_NOT_FOUND",
  MEMBER_NOT_FOUND: "MEMBER_NOT_FOUND",
  /** A selected member is not (or no longer) an active member. */
  MEMBER_NOT_ACTIVE: "MEMBER_NOT_ACTIVE",
  CANNOT_REMOVE_SELF: "CANNOT_REMOVE_SELF",
  LAST_MANAGER: "LAST_MANAGER",
  /** ADR-004: at most 2 managers per mess. */
  MANAGER_LIMIT_REACHED: "MANAGER_LIMIT_REACHED",
  SLUG_TAKEN: "SLUG_TAKEN",
  MEAL_TYPE_NOT_FOUND: "MEAL_TYPE_NOT_FOUND",
  MEAL_TYPE_NAME_TAKEN: "MEAL_TYPE_NAME_TAKEN",
  MEAL_TYPE_LIMIT_REACHED: "MEAL_TYPE_LIMIT_REACHED",

  // Months & accounting
  MONTH_ALREADY_ACTIVE: "MONTH_ALREADY_ACTIVE",
  MONTH_ALREADY_CLOSED: "MONTH_ALREADY_CLOSED",
  NO_ACTIVE_MONTH: "NO_ACTIVE_MONTH",
  /** An expense/deposit/bazaar date falls before the active month or in the future. */
  DATE_OUTSIDE_MONTH: "DATE_OUTSIDE_MONTH",
  EXPENSE_LOCKED: "EXPENSE_LOCKED",
  MONTH_NOT_FOUND: "MONTH_NOT_FOUND",
  MEAL_ENTRY_NOT_FOUND: "MEAL_ENTRY_NOT_FOUND",
  MEAL_ALREADY_SAVED: "MEAL_ALREADY_SAVED",
  /** Meals can only be saved for days that have ended (Bangladesh time). */
  MEAL_DATE_NOT_PAST: "MEAL_DATE_NOT_PAST",
  EXPENSE_NOT_FOUND: "EXPENSE_NOT_FOUND",
  DEPOSIT_NOT_FOUND: "DEPOSIT_NOT_FOUND",
  EXPENSE_MEMBERS_REQUIRED: "EXPENSE_MEMBERS_REQUIRED",
  INDIVIDUAL_EXPENSE_ONE_MEMBER: "INDIVIDUAL_EXPENSE_ONE_MEMBER",

  // Bazaar
  BAZAAR_NOT_FOUND: "BAZAAR_NOT_FOUND",
  BAZAAR_TOTAL_ZERO: "BAZAAR_TOTAL_ZERO",
  /** Approved or rejected already; only pending submissions can change. */
  BAZAAR_NOT_PENDING: "BAZAAR_NOT_PENDING",
  /** Someone else approved/rejected/edited it at the same moment. */
  BAZAAR_CHANGED: "BAZAAR_CHANGED",
  BAZAAR_NOT_OWNER: "BAZAAR_NOT_OWNER",
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
