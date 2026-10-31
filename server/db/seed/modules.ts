import { eq } from "drizzle-orm";
import { db } from "../client.ts";
import { modules } from "../schema.ts";
import { getModuleCatalog } from "../../lib/moduleCatalog.ts";

/**
 * Seeds every REAL app module (from moduleCatalog.ts, which mirrors
 * Sidebar.tsx) with its size-based recommended price as a starting point —
 * so pricing is never "ngasal" (arbitrary), and every module is priceable
 * from day one instead of needing 21 manual "Modul Baru" clicks. App Owner
 * can still edit any of these later.
 */
export async function seedModules() {
  for (const entry of getModuleCatalog()) {
    const [existing] = await db.select().from(modules).where(eq(modules.code, entry.code)).limit(1);
    if (existing) {
      console.log(`Modul '${entry.code}' sudah ada, skip.`);
      continue;
    }
    await db.insert(modules).values({
      code: entry.code,
      name: entry.label,
      basePriceIdr: entry.recommended.basePriceIdr,
      pricePerUserIdr: entry.recommended.pricePerUserIdr,
      pricePerEntityIdr: entry.recommended.pricePerEntityIdr,
    });
    console.log(`Modul '${entry.code}' dibuat (rekomendasi dari ${entry.lineCount} baris kode).`);
  }
}

async function runStandalone() {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
  const { pool } = await import("../client.ts");
  await seedModules();
  await pool.end();
}

// Only run standalone when executed directly (`tsx server/db/seed/modules.ts`), not when imported by index.ts.
if (process.argv[1]?.endsWith("modules.ts")) {
  runStandalone().catch((err) => {
    console.error("Seed modules gagal:", err);
    process.exit(1);
  });
}
