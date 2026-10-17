// Retry an async operation with backoff. The platform enforces request rate
// limits, and a burst of parallel list calls (several components mounting at
// once, plus dev double-invoke) can trip them. This lets a rejected call
// recover after a short wait instead of breaking the screen.
export async function withRetry(fn, attempts = 4, base = 500) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i === attempts - 1) break;
      const wait = base * (i + 1) + Math.floor(Math.random() * 150);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

// Run an array of async fns with a concurrency cap, preserving order.
// A burst of 10+ parallel list calls can trip the platform's request rate
// limit; streaming them (default 3 at a time) paces the load so it stays
// under the limit, and each fn keeps withRetry's backoff for any transient
// 429 that still slips through.
export async function mapLimit(fns, limit = 3) {
  const results = new Array(fns.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, fns.length) }, async () => {
    while (true) {
      const idx = next++;
      if (idx >= fns.length) return;
      results[idx] = await fns[idx]();
    }
  });
  await Promise.all(workers);
  return results;
}