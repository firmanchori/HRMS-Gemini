/**
 * Structured JSON logging + error tracking. No bespoke log-shipping here —
 * every hosting platform worth using (Render, Railway, Fly, Vercel, a
 * plain systemd/pm2 box) already captures stdout/stderr and lets you
 * search/alert on it; the only thing missing was consistent *structure*
 * (a raw `console.error(err)` on a 500 isn't searchable or alertable).
 *
 * Sentry is wired in but fully optional: with no SENTRY_DSN set, every
 * Sentry call below is a no-op and the app behaves exactly as before.
 * Set SENTRY_DSN (and optionally SENTRY_ENVIRONMENT) to activate it.
 */
import * as Sentry from "@sentry/node";

let sentryEnabled = false;

export function initErrorTracking() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
  sentryEnabled = true;
  log("info", "Error tracking initialized", { provider: "sentry" });
}

type LogLevel = "debug" | "info" | "warn" | "error";

/** One JSON object per line — never multi-line, so log aggregators that split on newlines don't mangle a stack trace into separate "lines". */
export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

/** Use for anything that should page/alert someone in production — request errors, failed background jobs, etc. */
export function logError(message: string, err: unknown, meta?: Record<string, unknown>) {
  const errInfo =
    err instanceof Error
      ? { errorMessage: err.message, errorStack: err.stack, errorName: err.name }
      : { errorMessage: String(err) };
  log("error", message, { ...errInfo, ...meta });
  if (sentryEnabled) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
      extra: { logMessage: message, ...meta },
    });
  }
}
