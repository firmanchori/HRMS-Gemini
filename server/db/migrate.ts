import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client.ts";

async function main() {
  console.log("Running migrations from ./drizzle ...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
