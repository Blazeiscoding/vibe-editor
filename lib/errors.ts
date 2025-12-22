/**
 * Custom error classes for consistent error handling across the application
 */

/**
 * Base application error with code and status
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = "INTERNAL_ERROR",
    statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error - user is not logged in
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "You must be logged in to perform this action") {
    super(message, "UNAUTHENTICATED", 401);
  }
}

/**
 * Authorization error - user doesn't have permission
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "You don't have permission to perform this action") {
    super(message, "FORBIDDEN", 403);
  }
}

/**
 * Validation error - input data is invalid
 */
export class ValidationError extends AppError {
  public readonly details: string[];

  constructor(message: string = "Validation failed", details: string[] = []) {
    super(message, "VALIDATION_ERROR", 400);
    this.details = details;
  }
}

/**
 * Not found error - resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

/**
 * Rate limit error - too many requests
 */
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super("Too many requests. Please try again later.", "RATE_LIMITED", 429);
    this.retryAfter = retryAfter;
  }
}

/**
 * Conflict error - resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, "CONFLICT", 409);
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

/**
 * Safely extract error code from unknown error
 */
export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code;
  }
  return "UNKNOWN_ERROR";
}

/**
 * Convert unknown error to API response
 */
export function handleApiError(error: unknown): Response {
  console.error("API Error:", error);

  if (isAppError(error)) {
    const body: Record<string, unknown> = {
      error: error.message,
      code: error.code,
    };

    if (error instanceof ValidationError && error.details.length > 0) {
      body.details = error.details;
    }

    if (error instanceof RateLimitError) {
      return new Response(JSON.stringify(body), {
        status: error.statusCode,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": error.retryAfter.toString(),
        },
      });
    }

    return Response.json(body, { status: error.statusCode });
  }

  // Unknown error - return 500
  return Response.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler?: (error: unknown) => R
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        return errorHandler(error);
      }
      throw error;
    }
  };
}
