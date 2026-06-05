import { describe, it, expect, beforeEach } from "vitest";
import { type NextRequest } from "next/server";
import {
  rateLimit,
  getClientId,
  rateLimitHeaders,
  enforceRateLimit,
  store,
} from "./rateLimit";

beforeEach(() => {
  store.clear();
});

// Build a minimal NextRequest stand-in — getClientId only reads headers.
function req(headers: Record<string, string> = {}): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

describe("rateLimit", () => {
  const opts = { limit: 3, windowMs: 1000 };

  it("allows requests under the limit and decrements remaining", () => {
    expect(rateLimit("a", opts, 0)).toMatchObject({ ok: true, remaining: 2 });
    expect(rateLimit("a", opts, 10)).toMatchObject({ ok: true, remaining: 1 });
    expect(rateLimit("a", opts, 20)).toMatchObject({ ok: true, remaining: 0 });
  });

  it("blocks once the limit is exceeded within the window", () => {
    rateLimit("a", opts, 0);
    rateLimit("a", opts, 0);
    rateLimit("a", opts, 0);
    const blocked = rateLimit("a", opts, 100);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBe(900);
  });

  it("resets after the window elapses", () => {
    rateLimit("a", opts, 0);
    rateLimit("a", opts, 0);
    rateLimit("a", opts, 0);
    expect(rateLimit("a", opts, 100).ok).toBe(false);
    // Window rolls over at t=1000.
    expect(rateLimit("a", opts, 1000)).toMatchObject({ ok: true, remaining: 2 });
  });

  it("tracks keys independently", () => {
    rateLimit("a", opts, 0);
    rateLimit("a", opts, 0);
    rateLimit("a", opts, 0);
    expect(rateLimit("a", opts, 0).ok).toBe(false);
    expect(rateLimit("b", opts, 0).ok).toBe(true);
  });
});

describe("getClientId", () => {
  it("uses the first x-forwarded-for entry", () => {
    expect(getClientId(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientId(req({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("falls back to 'unknown' when no IP headers exist", () => {
    expect(getClientId(req())).toBe("unknown");
  });
});

describe("rateLimitHeaders", () => {
  it("emits RateLimit-* headers for an allowed result", () => {
    const headers = rateLimitHeaders({
      ok: true, limit: 60, remaining: 59, resetAt: Date.now() + 60_000, retryAfterMs: 0,
    });
    expect(headers["RateLimit-Limit"]).toBe("60");
    expect(headers["RateLimit-Remaining"]).toBe("59");
    expect(headers["Retry-After"]).toBeUndefined();
  });

  it("adds Retry-After when blocked", () => {
    const headers = rateLimitHeaders({
      ok: false, limit: 60, remaining: 0, resetAt: Date.now() + 30_000, retryAfterMs: 30_000,
    });
    expect(headers["Retry-After"]).toBe("30");
  });
});

describe("enforceRateLimit", () => {
  const opts = { limit: 2, windowMs: 60_000 };

  it("returns null limited response while under the limit", () => {
    const { limited, result } = enforceRateLimit(req({ "x-forwarded-for": "1.1.1.1" }), opts, "test");
    expect(limited).toBeNull();
    expect(result.ok).toBe(true);
  });

  it("returns a 429 response once exceeded", async () => {
    const r = req({ "x-forwarded-for": "2.2.2.2" });
    enforceRateLimit(r, opts, "test");
    enforceRateLimit(r, opts, "test");
    const { limited } = enforceRateLimit(r, opts, "test");
    expect(limited).not.toBeNull();
    expect(limited!.status).toBe(429);
    expect(limited!.headers.get("Retry-After")).toBeTruthy();
    const body = await limited!.json();
    expect(body.error).toMatch(/too many/i);
  });

  it("isolates clients by key prefix + IP", () => {
    const a = req({ "x-forwarded-for": "3.3.3.3" });
    enforceRateLimit(a, opts, "test");
    enforceRateLimit(a, opts, "test");
    expect(enforceRateLimit(a, opts, "test").limited).not.toBeNull();
    // Different prefix → different bucket.
    expect(enforceRateLimit(a, opts, "other").limited).toBeNull();
  });
});
