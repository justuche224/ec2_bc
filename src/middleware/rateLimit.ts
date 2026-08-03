import type { MiddlewareHandler } from "hono";

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(
  options: { limit?: number; windowMs?: number } = {}
): MiddlewareHandler {
  const limit = options.limit ?? 10;
  const windowMs = options.windowMs ?? 60_000;
  const buckets = new Map<string, Bucket>();

  return async (c, next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "global";
    const now = Date.now();

    if (buckets.size > 1000) {
      for (const [key, bucket] of buckets) {
        if (now >= bucket.resetAt) buckets.delete(key);
      }
    }

    const bucket = buckets.get(ip);
    if (!bucket || now >= bucket.resetAt) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs });
    } else if (bucket.count >= limit) {
      return c.json(
        { error: "Too many requests. Please wait a moment and try again." },
        429
      );
    } else {
      bucket.count += 1;
    }

    await next();
  };
}
