import NetInfo from '@react-native-community/netinfo';

import { ApiClientError, apiClient } from '../apiClient';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('apiClient error normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(NetInfo.fetch).mockResolvedValue({ isConnected: true } as never);
    globalThis.fetch = jest.fn();
  });

  it('returns a friendly offline error without making a request', async () => {
    jest.mocked(NetInfo.fetch).mockResolvedValue({ isConnected: false } as never);

    await expect(apiClient.request('/routes')).rejects.toMatchObject({
      kind: 'offline',
      message: 'You are offline. Connect to the internet and try again.',
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'bad-request'],
    [403, 'forbidden'],
    [408, 'timeout'],
    [429, 'quota-exceeded'],
  ] as const)('maps HTTP %s to %s', async (status, kind) => {
    jest.mocked(globalThis.fetch).mockResolvedValue(response(status, {}));

    await expect(apiClient.request('/service', { maxRetries: 0 })).rejects.toMatchObject({
      kind,
      status,
      message: expect.any(String),
    });
  });

  it('distinguishes an empty routes response from invalid JSON', async () => {
    jest.mocked(globalThis.fetch).mockResolvedValue(response(200, { routes: [] }));
    const request = apiClient.request('/routes');

    await expect(request).rejects.toBeInstanceOf(ApiClientError);
    await expect(request).rejects.toMatchObject({
      kind: 'no-route-found',
      message: 'No route was found between these places.',
    });
  });

  it('retries explicitly retryable POST calls with bounded backoff', async () => {
    jest
      .mocked(globalThis.fetch)
      .mockResolvedValueOnce(response(503, {}))
      .mockResolvedValue(response(200, { routes: [{ id: 'route-1' }] }));

    await expect(
      apiClient.request('/routes', {
        method: 'POST',
        retryable: true,
        maxRetries: 1,
      }),
    ).resolves.toEqual({ routes: [{ id: 'route-1' }] });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});