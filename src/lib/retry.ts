import React from 'react';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

interface RetryState {
  attempt: number;
  lastError: any;
  isRetrying: boolean;
}

export class RetryError extends Error {
  public readonly attempt: number;
  public readonly lastError: any;
  public readonly allErrors: any[];

  constructor(attempt: number, lastError: any, allErrors: any[]) {
    super(`Failed after ${attempt} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
    this.name = 'RetryError';
    this.attempt = attempt;
    this.lastError = lastError;
    this.allErrors = allErrors;
  }
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: any) => {
    // Retry on network errors, timeouts, and server errors (5xx)
    if (error?.name === 'NetworkError' || error?.name === 'TimeoutError') {
      return true;
    }
    
    // For fetch errors, check status
    if (error?.response?.status >= 500) {
      return true;
    }
    
    // Retry on specific error messages
    const retryableMessages = [
      'fetch failed',
      'network error',
      'connection refused',
      'timeout',
      'service unavailable',
      'internal server error',
      'bad gateway',
      'gateway timeout',
    ];
    
    const errorMessage = (error?.message || '').toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg));
  },
  onRetry: () => {}, // Default no-op
};

/**
 * Retry an async function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...defaultRetryOptions, ...options };
  const errors: any[] = [];
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      errors.push(error);
      
      // If it's the last attempt or error is not retryable, throw
      if (attempt > config.maxRetries || !config.retryCondition(error)) {
        throw new RetryError(attempt, error, errors);
      }
      
      // Call retry callback
      config.onRetry(error, attempt);
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;
      const finalDelay = delay + jitter;
      
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new RetryError(config.maxRetries + 1, errors[errors.length - 1], errors);
}

/**
 * Hook for managing retry state in React components
 */
export function useRetryState(initialState?: Partial<RetryState>) {
  const [retryState, setRetryState] = React.useState<RetryState>({
    attempt: 0,
    lastError: null,
    isRetrying: false,
    ...initialState,
  });
  
  const startRetry = React.useCallback(() => {
    setRetryState(prev => ({ ...prev, isRetrying: true }));
  }, []);
  
  const incrementAttempt = React.useCallback((error: any) => {
    setRetryState(prev => ({
      ...prev,
      attempt: prev.attempt + 1,
      lastError: error,
    }));
  }, []);
  
  const completeRetry = React.useCallback((success: boolean) => {
    setRetryState(prev => ({
      ...prev,
      isRetrying: false,
      ...(success && { attempt: 0, lastError: null }),
    }));
  }, []);
  
  const reset = React.useCallback(() => {
    setRetryState({ attempt: 0, lastError: null, isRetrying: false });
  }, []);
  
  return {
    ...retryState,
    startRetry,
    incrementAttempt,
    completeRetry,
    reset,
  };
}

/**
 * Specialized retry for API calls
 */
export async function apiRetry<T>(
  apiCall: () => Promise<T>,
  options: RetryOptions & { 
    apiName?: string;
    timeout?: number;
  } = {}
): Promise<T> {
  const { timeout = 30000, apiName = 'API', ...retryOptions } = options;
  
  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const result = await apiCall();
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (controller.signal.aborted) {
        throw new Error(`${apiName} call timed out after ${timeout}ms`);
      }
      
      throw error;
    }
  }, {
    ...retryOptions,
    onRetry: (error, attempt) => {
      console.warn(`${apiName} call failed (attempt ${attempt}):`, error.message);
      if (retryOptions.onRetry) {
        retryOptions.onRetry(error, attempt);
      }
    },
  });
}

/**
 * Retry options for different types of API calls
 */
export const RETRY_CONFIGS = {
  contentGeneration: {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 8000,
    backoffFactor: 2,
  } as RetryOptions,
  
  keywordResearch: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 1.5,
  } as RetryOptions,
  
  dataSave: {
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 2000,
    backoffFactor: 1.8,
  } as RetryOptions,
  
  quickOperation: {
    maxRetries: 2,
    baseDelay: 300,
    maxDelay: 1000,
    backoffFactor: 2,
  } as RetryOptions,
} as const;