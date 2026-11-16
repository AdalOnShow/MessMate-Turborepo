import type { ErrorCode } from "./error-codes";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiErrorResponse extends ApiResponse<never> {
  success: false;
  statusCode: number;
  /** Stable machine-readable code; see `ErrorCode`. */
  code: ErrorCode;
  error?: string;
  path?: string;
  /** Correlates this response with server logs (also in `X-Request-Id`). */
  requestId?: string;
  details?: unknown;
}

export function isApiResponse(value: unknown): value is ApiResponse {
  if (typeof value !== "object" || value === null) return false;

  const response = value as Partial<ApiResponse>;
  return (
    typeof response.success === "boolean" &&
    typeof response.message === "string"
  );
}
