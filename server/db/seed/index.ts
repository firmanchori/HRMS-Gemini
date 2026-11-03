import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "../client.ts";
import { subscriptionPlans, users, modules, discountSchemes } from "../schema.ts";
import { seedModules } from "./modules.ts";
import { seedExamples } from "./examples.ts";
import { seedTenantOrgExamples } from "./tenantOrgExamples.ts";
import { seedRecruitmentMasterData, seedRecruitmentSamplesForContoh } from "./recruitmentExamples.ts";
import { seedEmployeeExamples } from "./employeeExamples.ts";
import { seedAttendanceExamples } from "./attendanceExamples.ts";
import { computeMonthlyReference } from "../../lib/pricing.ts";

const PRESET_TIERS = [
  { name: "Starter", moduleCodes: ["ess", "attendance", "payroll"], maxEmployees: 50, maxEntities: 1, allowsMultiEntity: false },
  {
    name: "Professional",
    moduleCodes: ["ess", "mss", "organization", "attendance", "payroll", "loans", "recruitment", "employees", "personalia", "trips", "approvals", "kpi"],
    maxEmployees: 500,
    maxEntities: 3,
    allowsMultiEntity: true,
  },
  { name: "Enterprise", moduleCodes: ["*"], maxEmployees: 5000, maxEntities: 50, allowsMultiEntity: true },
];

/** Default duration-discount scheme every preset plan gets — editable per-plan afterwards in "Kelola Paket". */
const DEFAULT_DURATION_TIERS = [
  { minValue: 12, discountPercent: 10 },
  { minValue: 24, discountPercent: 20 },
  { minValue: 60, discountPercent: 35 },
];

async function seedPresetPlans() {
  const allModules = await db.select().from(modules);

  for (const tier of PRESET_TIERS) {
    const [existing] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, tier.name)).limit(1);
    if (existing) {
      console.log(`Plan '${tier.name}' sudah ada, skip.`);
      continue;
    }

    const selected = tier.moduleCodes.includes("*") ? allModules : allModules.filter((m) => tier.moduleCodes.includes(m.code));
    const referenceMonthlyPriceIdr = computeMonthlyReference(selected, tier.maxEmployees, tier.maxEntities);

    const [plan] = await db
      .insert(subscriptionPlans)
      .values({
        name: tier.name,
        allowsMultiEntity: tier.allowsMultiEntity,
        maxEmployees: tier.maxEmployees,
        maxEntities: tier.maxEntities,
        enabledModules: tier.moduleCodes,
        durationDays: 30, // "default term" shown on the card; actual term is chosen at signup
        referenceMonthlyPriceIdr,
        permanentDiscountPercent: 0,
        priceIdr: referenceMonthlyPriceIdr, // no markdown yet -> sale price == reference price
      })
      .returning();

    await db.insert(discountSchemes).values({
      planId: plan.id,
      schemeType: "duration_months",
      label: "Diskon Komitmen Durasi",
      tiers: DEFAULT_DURATION_TIERS,
    });

    console.log(`Plan '${tier.name}' dibuat: Rp ${referenceMonthlyPriceIdr.toLocaleString("id-ID")}/bulan (id: ${plan.id})`);
  }
}

async function seedAppOwner() {
  const email = process.env.APP_OWNER_SEED_EMAIL || "owner@nusahr.local";
  const password = process.env.APP_OWNER_SEED_PASSWORD || "ChangeMe123!";

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    console.log(`App Owner '${email}' sudah ada, skip.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    tenantId: null,
    role: "app_owner",
    name: "App Owner",
    email,
    passwordHash,
  });
  console.log(`App Owner dibuat: ${email} / password dari APP_OWNER_SEED_PASSWORD (default: ${password})`);
}

async function main() {
  await seedModules();
  await seedPresetPlans();
  await seedAppOwner();
  await seedExamples();
  await seedTenantOrgExamples();
  await seedRecruitmentMasterData();
  await seedRecruitmentSamplesForContoh();
  await seedEmployeeExamples();
  await seedAttendanceExamples();
  await pool.end();
}

main().catch((err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});
