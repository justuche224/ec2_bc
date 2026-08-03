export function createRateLimiter(options = {}) {
    var _a, _b;
    const limit = (_a = options.limit) !== null && _a !== void 0 ? _a : 10;
    const windowMs = (_b = options.windowMs) !== null && _b !== void 0 ? _b : 60000;
    const buckets = new Map();
    return async (c, next) => {
        var _a, _b;
        const ip = ((_b = (_a = c.req.header("x-forwarded-for")) === null || _a === void 0 ? void 0 : _a.split(",")[0]) === null || _b === void 0 ? void 0 : _b.trim()) || "global";
        const now = Date.now();
        if (buckets.size > 1000) {
            for (const [key, bucket] of buckets) {
                if (now >= bucket.resetAt)
                    buckets.delete(key);
            }
        }
        const bucket = buckets.get(ip);
        if (!bucket || now >= bucket.resetAt) {
            buckets.set(ip, { count: 1, resetAt: now + windowMs });
        }
        else if (bucket.count >= limit) {
            return c.json({ error: "Too many requests. Please wait a moment and try again." }, 429);
        }
        else {
            bucket.count += 1;
        }
        await next();
    };
}
