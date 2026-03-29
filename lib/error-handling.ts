// Error handling utilities for the application
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// Common error codes
export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Wallet errors
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  INVALID_AMOUNT: "INVALID_AMOUNT",
  MINIMUM_AMOUNT_NOT_MET: "MINIMUM_AMOUNT_NOT_MET",
  WITHDRAWAL_LIMIT_EXCEEDED: "WITHDRAWAL_LIMIT_EXCEEDED",

  // Payment errors
  INVALID_DESTINATION: "INVALID_DESTINATION",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_TIMEOUT: "PAYMENT_TIMEOUT",
  INVALID_PROVIDER: "INVALID_PROVIDER",

  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Server errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",

  // Generic error
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

// Error messages mapping
export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.UNAUTHORIZED]: "You are not authorized to perform this action.",
  [ErrorCodes.FORBIDDEN]: "Access forbidden.",
  [ErrorCodes.SESSION_EXPIRED]:
    "Your session has expired. Please log in again.",

  [ErrorCodes.INSUFFICIENT_BALANCE]:
    "Your balance is insufficient for this withdrawal.",
  [ErrorCodes.INVALID_AMOUNT]: "Please enter a valid amount.",
  [ErrorCodes.MINIMUM_AMOUNT_NOT_MET]: "Amount must be at least the minimum.",
  [ErrorCodes.WITHDRAWAL_LIMIT_EXCEEDED]:
    "You have exceeded your withdrawal limit.",

  [ErrorCodes.INVALID_DESTINATION]:
    "Please provide a valid payment destination.",
  [ErrorCodes.PROVIDER_UNAVAILABLE]:
    "Payment provider is currently unavailable. Please try again later.",
  [ErrorCodes.PAYMENT_FAILED]: "Payment processing failed. Please try again.",
  [ErrorCodes.PAYMENT_TIMEOUT]:
    "Payment request timed out. Please check your connection.",
  [ErrorCodes.INVALID_PROVIDER]: "Invalid payment provider selected.",

  [ErrorCodes.NETWORK_ERROR]: "Network error. Please check your connection.",
  [ErrorCodes.REQUEST_TIMEOUT]: "Request timed out. Please try again.",
  [ErrorCodes.SERVICE_UNAVAILABLE]: "Service is temporarily unavailable.",

  [ErrorCodes.VALIDATION_ERROR]: "Please check your input and try again.",
  [ErrorCodes.INVALID_INPUT]: "Invalid input provided.",

  [ErrorCodes.INTERNAL_SERVER_ERROR]: "An internal server error occurred.",
  [ErrorCodes.DATABASE_ERROR]: "Database error. Please try again later.",

  [ErrorCodes.UNKNOWN_ERROR]: "An unexpected error occurred.",
};

// Get user-friendly error message
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return ErrorMessages[error.code] || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return ErrorMessages[ErrorCodes.UNKNOWN_ERROR];
}

// Handle error and return AppError
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Network timeouts
    if (error.message.includes("timeout")) {
      return new AppError(
        ErrorCodes.REQUEST_TIMEOUT,
        ErrorMessages[ErrorCodes.REQUEST_TIMEOUT],
        408,
      );
    }

    // Network errors
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return new AppError(
        ErrorCodes.NETWORK_ERROR,
        ErrorMessages[ErrorCodes.NETWORK_ERROR],
        0,
      );
    }

    // Database errors
    if (error.message.includes("database") || error.message.includes("DB")) {
      return new AppError(
        ErrorCodes.DATABASE_ERROR,
        ErrorMessages[ErrorCodes.DATABASE_ERROR],
        500,
      );
    }

    return new AppError(
      ErrorCodes.UNKNOWN_ERROR,
      error.message || ErrorMessages[ErrorCodes.UNKNOWN_ERROR],
      500,
    );
  }

  return new AppError(
    ErrorCodes.UNKNOWN_ERROR,
    ErrorMessages[ErrorCodes.UNKNOWN_ERROR],
    500,
  );
}

// Retry logic with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx)
      if (
        error instanceof AppError &&
        error.statusCode >= 400 &&
        error.statusCode < 500 &&
        error.code !== ErrorCodes.NETWORK_ERROR &&
        error.code !== ErrorCodes.REQUEST_TIMEOUT
      ) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
