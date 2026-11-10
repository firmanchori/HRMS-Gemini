import { config } from "dotenv";
config({ path: ".env.local" });

import { createApp } from "./app.ts";
import { initErrorTracking, log, logError } from "./lib/logger.ts";
import { applyDuePersonaliaActions } from "./lib/personalia.ts";

initErrorTracking();

// A process-level crash is still a crash — these don't try to keep running
// in a corrupted state (Node's own guidance: after uncaughtException, the
// process is in an undefined state). They just make sure the error reaches
// the logs/Sentry before the process exits, so a restart (pm2/systemd/the
// hosting platform) has something to go on instead of a silent death.
process.on("uncaughtException", (err) => {
  logError("Uncaught exception — process exiting", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logError("Unhandled promise rejection — process exiting", reason);
  process.exit(1);
});

const PORT = process.env.API_PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  log("info", `NusaHR API listening on http://localhost:${PORT}`);
});

// Approved Personalia SKs whose effective date is in the future are applied here once it arrives (hourly + on boot).
const sweepPersonalia = () => applyDuePersonaliaActions().then((n) => n > 0 && log("info", `Personalia: ${n} SK diterapkan pada tanggal efektif`)).catch((err) => logError("Personalia sweep failed", err));
sweepPersonalia();
setInterval(sweepPersonalia, 60 * 60 * 1000).unref();
