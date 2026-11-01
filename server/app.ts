import express from "express";
import "express-async-errors"; // makes thrown/rejected errors in async handlers reach the error middleware below instead of crashing the process
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { resolveTenant } from "./middleware/tenant.ts";
import { authRouter } from "./routes/auth.ts";
import { publicRouter } from "./routes/public.ts";
import { appOwnerRouter } from "./routes/appOwner.ts";
import { tenantRouter } from "./routes/tenant.ts";
import { globalLimiter } from "./lib/rateLimit.ts";

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
  app.use(resolveTenant);

  app.use("/api/auth", authRouter);
  app.use("/api", publicRouter);
  app.use("/api/app-owner", appOwnerRouter);
  app.use("/api/tenant", tenantRouter);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, tenant: _req.tenant?.subdomain ?? "app-owner" });
  });

  // Last middleware: catches anything thrown/rejected in a route (including
  // a missing env var like JWT_SECRET) and returns 500 instead of crashing
  // the whole server process.
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[api error]", err);
    res.status(500).json({ error: "Terjadi kesalahan di server", detail: err.message });
  });

  return app;
}
