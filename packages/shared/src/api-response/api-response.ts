export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiErrorResponse extends ApiResponse<never> {
  success: false;
  statusCode: number;
  error?: string;
  path?: string;
  details?: unknown;
}

export function isApiResponse(value: unknown): value is ApiResponse {
  if (typeof value !== 'object' || value === null) return false;

  const response = value as Partial<ApiResponse>;
  return (
    typeof response.success === 'boolean' &&
    typeof response.message === 'string'
  );
}
