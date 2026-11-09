import express from "express";
import "express-async-errors"; // makes thrown/rejected errors in async handlers reach the error middleware below instead of crashing the process
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { resolveTenant } from "./middleware/tenant.ts";
import { requireCsrfToken, ensureCsrfCookie } from "./middleware/auth.ts";
import { authRouter } from "./routes/auth.ts";
import { publicRouter } from "./routes/public.ts";
import { appOwnerRouter } from "./routes/appOwner.ts";
import { tenantRouter } from "./routes/tenant.ts";
import { employeeRouter } from "./routes/employee.ts";
import { globalLimiter } from "./lib/rateLimit.ts";
import { log, logError } from "./lib/logger.ts";
import { pool } from "./db/client.ts";

/**
 * CORS origin allowlist (.claude/security-hardening-rules.md §3, API8):
 * only the configured base domain and its subdomains may send credentialed
 * requests — never reflect an arbitrary Origin with credentials:true.
 */
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // non-browser clients (curl, server-to-server)
  try {
    const { hostname } = new URL(origin);
    const baseHost = (process.env.APP_BASE_DOMAIN || "localhost:3000").split(":")[0];
    return hostname === baseHost || hostname.endsWith(`.${baseHost}`);
  } catch {
    return false;
  }
}

/** Builds the configured Express app without binding a port — lets integration tests (supertest) exercise real routes/middleware against the real DB without a listener. */
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(globalLimiter);
  app.use(ensureCsrfCookie);
  app.use(requireCsrfToken);

  // Operational visibility: log only the requests worth looking at later
  // (errors, and anything unusually slow) — logging every successful GET
  // would drown real signal, since a single dashboard load alone fires
  // ~30 of them.
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const durationMs = Date.now() - start;
      if (res.statusCode >= 400 || durationMs > 1000) {
        log(res.statusCode >= 500 ? "error" : "warn", "request", {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs,
          tenant: req.tenant?.subdomain ?? null,
        });
      }
    });
    next();
  });

  app.use(resolveTenant);

  app.use("/api/auth", authRouter);
  app.use("/api", publicRouter);
  app.use("/api/app-owner", appOwnerRouter);
  app.use("/api/tenant", tenantRouter);
  app.use("/api/employee", employeeRouter);

  // Liveness vs. readiness: a load balancer or uptime monitor can tell
  // "process is up" (ok: true, db: false) apart from "fully serving
  // traffic" (db: true) — ping the pool rather than assuming the process
  // being alive means the database is reachable.
  app.get("/api/health", async (_req, res) => {
    let dbOk = false;
    try {
      await pool.query("SELECT 1");
      dbOk = true;
    } catch (err) {
      logError("Health check DB ping failed", err);
    }
    res.status(dbOk ? 200 : 503).json({ ok: true, db: dbOk, tenant: _req.tenant?.subdomain ?? "app-owner" });
  });

  // Last middleware: catches anything thrown/rejected in a route (including
  // a missing env var like JWT_SECRET) and returns 500 instead of crashing
  // the whole server process.
  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logError("Unhandled route error", err, { method: req.method, path: req.path, tenant: req.tenant?.subdomain ?? null });
    const isProd = process.env.NODE_ENV === "production";
    res.status(500).json({ error: "Terjadi kesalahan di server", detail: isProd ? undefined : err.message });
  });

  return app;
}
