import Logger from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class StorageError extends AppError {
  constructor(
    message: string,
    public operation?: string
  ) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export function handleError(error: unknown, context?: string): void {
  if (error instanceof AppError) {
    Logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
      code: error.code,
      context: error.context,
    });
  } else if (error instanceof Error) {
    Logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
      stack: error.stack,
    });
  } else {
    Logger.error(`${context ? `[${context}] ` : ''}Unknown error`, { error });
  }
}

export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          handleError(error, context);
          throw error;
        });
      }
      return result;
    } catch (error) {
      handleError(error, context);
      throw error;
    }
  }) as T;
}

export function createSafeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  fallbackValue?: ReturnType<T>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, fn.name);
      return fallbackValue as ReturnType<T>;
    }
  }) as T;
}
