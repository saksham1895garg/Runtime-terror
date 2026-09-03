export function getMLApiUrl(): string {
  const url = process.env.ML_API_URL;
  const isProd = process.env.NODE_ENV === 'production';
  
  if (!url) {
    if (isProd) {
      throw new Error("CRITICAL: ML_API_URL environment variable is missing in production.");
    }
    console.warn("WARNING: ML_API_URL is missing. Falling back to localhost for development.");
    return "http://127.0.0.1:18000";
  }
  
  // Ensure no trailing slash
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export class MLError extends Error {
  public status: number;
  public details: string;

  constructor(message: string, status: number, details: string = "") {
    super(message);
    this.name = 'MLError';
    this.status = status;
    this.details = details;
  }
}

export async function fetchML(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getMLApiUrl();
  const targetUrl = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  // Reduced timeout to 4 seconds to keep integration tests responsive
  const timeoutMs = 4000; // 4 seconds max for API calls
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const mergedOptions: RequestInit = {
    ...options,
    signal: controller.signal as any,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  };

  let res: Response;
  try {
    res = await fetch(targetUrl, mergedOptions);
    clearTimeout(id);
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new MLError('ML Backend Request Timed Out', 504);
    }
    throw new MLError(`ML Backend Connection Failed: ${error.message}`, 503);
  }

  // Attempt to map HTTP errors cleanly
  if (!res.ok) {
    let errorText = '';
    try {
      const errorJson = await res.json();
      errorText = JSON.stringify(errorJson);
    } catch {
      errorText = await res.text().catch(() => 'No text provided');
    }
    throw new MLError(`ML Backend Error ${res.status}`, res.status, errorText.substring(0, 200));
  }

  try {
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: true, status: res.status, data: null };
  }
}
