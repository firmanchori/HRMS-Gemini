import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { tenants } from "../db/schema.ts";

export type ResolvedTenant = typeof tenants.$inferSelect;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant: ResolvedTenant | null;
    }
  }
}

/**
 * Resolves the tenant from the subdomain (one tenant = one subdomain, per
 * docs/PRD.md §1.1 and the Phase 0 roadmap note). Requests on the bare base
 * domain (no subdomain) are App Owner context: req.tenant is null. A
 * subdomain that doesn't match any tenant is rejected — the login page must
 * never silently fall through to a different tenant's data.
 *
 * Reads the *Origin* header first, not Host: when the frontend (its own
 * origin, e.g. iotlen.localhost:3000) calls the API on a different port
 * (localhost:4000), the browser's Host header is the API's own host, not
 * the page's — only Origin reflects what subdomain the browser is actually
 * on. Falls back to Host for same-origin/non-browser requests (curl, a
 * same-domain reverse-proxied production setup) where Origin is absent.
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
  let host = (req.headers.host || "").toLowerCase();
  const origin = req.headers.origin;
  if (origin) {
    try {
      const url = new URL(origin);
      host = url.port ? `${url.hostname}:${url.port}` : url.hostname;
    } catch {
      // malformed Origin header — fall back to Host below
    }
  }

  if (host === baseDomain || host === `www.${baseDomain}`) {
    req.tenant = null;
    return next();
  }

  if (!host.endsWith(`.${baseDomain}`)) {
    // Host doesn't match the configured base domain at all (e.g. bare
    // 127.0.0.1 during local dev without the wildcard set up) — treat as
    // App Owner context rather than hard-failing local development.
    req.tenant = null;
    return next();
  }

  const subdomain = host.slice(0, -(baseDomain.length + 1));
  const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);

  if (!tenant) {
    return res.status(404).json({ error: `Tenant tidak ditemukan untuk subdomain "${subdomain}"` });
  }

  req.tenant = tenant;
  next();
}
