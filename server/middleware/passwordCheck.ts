import type { Request, Response, NextFunction } from "express";
import { isPasswordBreached } from "../lib/hibp.ts";

/**
 * Drop into any route (after its validateBody schema check) that accepts a
 * new password — signup, reset, admin-created accounts. getPassword reads
 * it back out of the already-validated req.body, since the field lives at
 * a different path per route (top-level "password"/"adminPassword"/
 * "newPassword", or nested under "admin.password").
 */
export function rejectBreachedPassword(getPassword: (req: Request) => string | undefined) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const password = getPassword(req);
    if (typeof password !== "string") return next();

    if (await isPasswordBreached(password)) {
      return res.status(400).json({
        error: "Kata sandi ini pernah muncul dalam kebocoran data publik. Gunakan kata sandi lain yang belum pernah dipakai di tempat lain.",
      });
    }
    next();
  };
}
