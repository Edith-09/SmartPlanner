import NetInfo from '@react-native-community/netinfo';

export type ApiClientErrorKind =
  | 'aborted'
  | 'bad-request'
  | 'forbidden'
  | 'invalid-response'
  | 'network'
  | 'no-route-found'
  | 'offline'
  | 'quota-exceeded'
  | 'timeout';

export class ApiClientError extends Error {
  readonly kind: ApiClientErrorKind;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(
    message: string,
    kind: ApiClientErrorKind,
    options: { status?: number; retryable?: boolean } = {},
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.kind = kind;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'signal'> {
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRetries?: number;
  retryable?: boolean;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 300;
const MAX_BACKOFF_MS = 2_000;
const RETRYABLE_HTTP_STATUSES = new Set([408, 429]);
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const ERROR_MESSAGES: Record<ApiClientErrorKind, string> = {
  aborted: 'The request was cancelled.',
  'bad-request': 'The request could not be understood. Please check the selected places and try again.',
  forbidden: 'This service is unavailable. Check that the API key is valid and the API is enabled.',
  'invalid-response': 'The service returned an unexpected response. Please try again.',
  network: 'Unable to reach the service. Check your connection and try again.',
  'no-route-found': 'No route was found between these places.',
  offline: 'You are offline. Connect to the internet and try again.',
  'quota-exceeded': 'The service is temporarily busy. Please wait a moment and try again.',
  timeout: 'The request took too long. Please try again.',
};

const isRetryableStatus = (status: number): boolean =>
  RETRYABLE_HTTP_STATUSES.has(status) || status >= 500;

const waitForRetry = (delayMs: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ApiClientError('Request aborted', 'aborted'));
      return;
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);

    const onAbort = (): void => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
      reject(new ApiClientError('Request aborted', 'aborted'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });

const makeError = (
  kind: ApiClientErrorKind,
  options: { status?: number; retryable?: boolean } = {},
): ApiClientError => new ApiClientError(ERROR_MESSAGES[kind], kind, options);

const makeAbortError = (): ApiClientError => makeError('aborted');

function mapHttpError(status: number): ApiClientError {
  if (status === 400) {
    return makeError('bad-request', { status });
  }
  if (status === 403) {
    return makeError('forbidden', { status });
  }
  if (status === 429) {
    return makeError('quota-exceeded', { status, retryable: true });
  }
  if (status === 408) {
    return makeError('timeout', { status, retryable: true });
  }
  if (status >= 500) {
    return makeError('network', { status, retryable: isRetryableStatus(status) });
  }
  return new ApiClientError(`Request failed with HTTP ${status}`, 'network', { status });
}

function isEmptyRouteResponse(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'routes' in value &&
    Array.isArray(value.routes) &&
    value.routes.length === 0
  );
}

async function performRequest<T>(
  url: string,
  options: ApiRequestOptions,
): Promise<T> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    signal: callerSignal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryable = false,
    ...requestInit
  } = options;
  const method = (requestInit.method ?? 'GET').toUpperCase();
  const retryLimit = IDEMPOTENT_METHODS.has(method) || retryable ? maxRetries : 0;

  try {
    const networkState = await NetInfo.fetch();
    if (networkState.isConnected === false) {
      throw makeError('offline');
    }
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
  }

  for (let attempt = 0; ; attempt += 1) {
    if (callerSignal?.aborted) {
      throw makeAbortError();
    }

    const controller = new AbortController();
    let timedOut = false;
    const abortFromCaller = (): void => controller.abort();
    callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
    if (callerSignal?.aborted) {
      abortFromCaller();
    }
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    let retryError: ApiClientError | undefined;

    try {
      const response = await fetch(url, {
        ...requestInit,
        method,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw mapHttpError(response.status);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        if (callerSignal?.aborted) {
          throw makeAbortError();
        }
        if (timedOut) {
          throw makeError('timeout', { retryable: true });
        }
        throw makeError('invalid-response');
      }
      if (isEmptyRouteResponse(data)) {
        throw makeError('no-route-found');
      }
      return data as T;
    } catch (error) {
      let normalizedError: ApiClientError;
      if (error instanceof ApiClientError) {
        normalizedError = error;
      } else if (callerSignal?.aborted) {
        normalizedError = makeAbortError();
      } else if (timedOut) {
        normalizedError = makeError('timeout', { retryable: true });
      } else {
        normalizedError = makeError('network', { retryable: true });
      }

      if (!normalizedError.retryable || attempt >= retryLimit) {
        throw normalizedError;
      }

      retryError = normalizedError;
    } finally {
      clearTimeout(timeout);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    }

    if (retryError) {
      const backoffMs = Math.min(INITIAL_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
      await waitForRetry(backoffMs, callerSignal);
    }
  }
}

export const apiClient = {
  request<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    return performRequest<T>(url, options);
  },
};
