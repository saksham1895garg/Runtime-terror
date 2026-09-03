import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchML, getMLApiUrl, MLError } from '@/utils/api/mlBackend';

describe('mlBackend API Wrapper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.stubGlobal('fetch', vi.fn());
  });

  it('uses ML_API_URL when provided', () => {
    process.env.ML_API_URL = 'http://test-backend.local';
    expect(getMLApiUrl()).toBe('http://test-backend.local');
  });

  it('maps 401 error safely', async () => {
    process.env.ML_API_URL = 'http://test';
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized access')
    } as any);

    await expect(fetchML('/secure-endpoint')).rejects.toThrowError(MLError);
    await expect(fetchML('/secure-endpoint')).rejects.toMatchObject({ status: 401 });
  });

  it('maps 404 error safely', async () => {
    process.env.ML_API_URL = 'http://test';
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found')
    } as any);

    await expect(fetchML('/missing')).rejects.toThrowError(MLError);
  });

  it('maps 422 error safely', async () => {
    process.env.ML_API_URL = 'http://test';
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 422,
      text: () => Promise.resolve('Validation Error')
    } as any);

    await expect(fetchML('/predict')).rejects.toThrowError(MLError);
  });

  it('maps 500 error safely', async () => {
    process.env.ML_API_URL = 'http://test';
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error')
    } as any);

    await expect(fetchML('/crash')).rejects.toThrowError(MLError);
  });
  
  it('handles network failure (fetch throws) safely', async () => {
    process.env.ML_API_URL = 'http://test';
    vi.mocked(fetch).mockRejectedValue(new Error('Network failure'));

    await expect(fetchML('/predict')).rejects.toThrowError(MLError);
    await expect(fetchML('/predict')).rejects.toMatchObject({ status: 503 });
  });
});
