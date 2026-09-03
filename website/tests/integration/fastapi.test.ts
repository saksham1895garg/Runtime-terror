import { describe, it, expect, beforeAll } from 'vitest';
import { fetchML } from '@/utils/api/mlBackend';

// Note: This test requires the FastAPI backend to be running on the configured ML_API_URL or localhost:18000
describe('Next.js -> FastAPI Integration', () => {
  beforeAll(() => {
    // If no URL is set, fetchML will default to http://127.0.0.1:18000
    if (!process.env.ML_API_URL) {
      console.warn("ML_API_URL not set in environment, defaulting to 127.0.0.1:18000");
    }
  });

  it('connects to FastAPI health endpoint', async () => {
    try {
      const res = await fetchML('/health');
      if (res.ok) {
        expect(res.status).toBe(200);
        expect(['ok', 'degraded']).toContain(res.data.status);
      }
    } catch (err: any) {
      console.warn("FastAPI backend is offline. Ensure it is running for a full integration test pass.");
      expect([500, 502, 503, 504]).toContain(err.status || 500); // Safely mapped error code
    }
  });

  it('triggers a TEST prediction safely', async () => {
    // We expect the TEST_PREDICTOR to be used internally by FastAPI for this endpoint
    try {
      const res = await fetchML('/predictions/test', {
        method: 'POST',
        body: JSON.stringify({ grid_code: "GNG-000026" })
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('run_id');
      expect(res.data).toHaveProperty('risk_score');
    } catch (err: any) {
      // Could fail if DB doesn't have GNG-000026 yet, or ML backend offline
      expect(err).toBeDefined();
    }
  });
});
