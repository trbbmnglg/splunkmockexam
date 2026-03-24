/**
 * HTTP fetch with exponential-backoff retry and 429 handling.
 */

export const fetchWithRetry = async (url, options, maxRetries = 5, timeoutMs = 30000, trace = null) => {
  const baseDelays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < maxRetries; i++) {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const parsedRetry = retryAfter ? parseFloat(retryAfter) : NaN;
        const waitMs = (Number.isFinite(parsedRetry) && parsedRetry > 0 && parsedRetry <= 300)
          ? Math.ceil(parsedRetry * 1000)
          : baseDelays[Math.min(i, baseDelays.length - 1)];
        if (trace) trace.retries += 1;
        console.warn(`[API] 429 rate limited — waiting ${(waitMs / 1000).toFixed(1)}s before retry ${i + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, baseDelays[Math.min(i, baseDelays.length - 1)]));
    }
  }
  throw new Error(`Max retries (${maxRetries}) exceeded`);
};
