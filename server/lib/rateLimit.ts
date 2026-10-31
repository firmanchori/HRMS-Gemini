import rateLimit from "express-rate-limit";

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

/** Baseline for every /api/* route. */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
