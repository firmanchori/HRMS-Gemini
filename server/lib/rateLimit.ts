import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

/**
 * Buckets by session rather than raw IP when a session cookie is present —
 * office/coworking traffic sits behind one shared NAT IP, so IP-only
 * keying meant every logged-in user at the same office competed for the
 * same 120 req/min bucket (one admin's dashboard load alone fires ~30
 * GETs). The raw cookie value doesn't need to be verified here: it's only
 * used as a bucketing key, and an invalid/expired token still uniquely
 * identifies "this browser", which is exactly what we want. Unauthenticated
 * requests (not yet logged in) still fall back to IP-based limiting.
 */
function sessionAwareKey(req: Request): string {
  const sessionCookie = (req as { cookies?: Record<string, string> }).cookies?.nusahr_session;
  return sessionCookie ? `sess:${sessionCookie}` : ipKeyGenerator(req.ip || "unknown");
}

/** Login/forgot-password: brute-force and email-bomb protection (OWASP API4). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan, coba lagi beberapa menit lagi" },
});

/** Signup/contact: cheap public endpoints that send email — stricter, longer window. */
export const publicWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan, coba lagi nanti" },
});

/**
 * Baseline for every /api/* route. A single tenant dashboard load fires
 * ~30 parallel GETs (loadTenantOrgData), and several staff at one office
 * share a NAT IP, so this needs real headroom for production multi-user
 * traffic while still bounding a runaway client/scraper. Tightened per-route
 * limiters (authLimiter, publicWriteLimiter) remain the actual brute-force
 * defense — this one just stops one client from hammering the API.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: sessionAwareKey,
});
