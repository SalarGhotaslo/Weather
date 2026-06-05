import { type NextRequest } from "next/server";

// Lightweight in-memory fixed-window rate limiter for the API routes. These
// routes proxy free upstream APIs (Open-Meteo, restcountries, CountriesNow),
// so the goal is to stop a single client from exhausting those quotas — not
// distributed throttling.
//
// NOTE: state lives in this module's memory, so each serverless instance keeps
// its own counters. That's sufficient for a single-instance / low-replica
// deployment. For multi-instance production scale, swap `store` for a shared
// backend (Upstash Redis, Vercel KV) behind the same `rateLimit()` signature.

interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the window rolls over
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number; // 0 when ok
}

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

// Exposed for tests so the store can be reset between cases.
export const store = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow unbounded from one-off keys.
function sweep(now: number): void {
  if (store.size < 10_000) return;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

/**
 * Record a hit for `key` and report whether it is within the allowance.
 * `now` is injectable for deterministic tests.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now: number = Date.now(),
): RateLimitResult {
  sweep(now);
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, limit, remaining: limit - 1, resetAt, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterMs: existing.resetAt - now,
    };
  }

  existing.count += 1;
  return {
    ok: true,
    limit,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterMs: 0,
  };
}

/**
 * Derive a best-effort client identifier from proxy headers. Falls back to a
 * shared bucket ("unknown") when no IP is present rather than failing open.
 */
export function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Standard rate-limit headers for both allowed and rejected responses. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  };
  if (!result.ok) {
    headers["Retry-After"] = String(Math.ceil(result.retryAfterMs / 1000));
  }
  return headers;
}

/**
 * Convenience guard for route handlers: enforces the limit for `request` and
 * returns a ready-to-send 429 `Response` when exceeded, or `null` when allowed.
 * The `result` is attached so callers can echo RateLimit-* headers on success.
 */
export function enforceRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
  keyPrefix = "",
): { limited: Response | null; result: RateLimitResult } {
  const result = rateLimit(`${keyPrefix}:${getClientId(request)}`, options);
  if (result.ok) return { limited: null, result };

  return {
    limited: Response.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: rateLimitHeaders(result) },
    ),
    result,
  };
}
