import { config } from "dotenv";
config({ path: ".env.local" });

import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.ts";

/**
 * Regression test for the subdomain isolation rule (testing-standards.md
 * rule 5: "any new query/action must have a test asserting it is scoped by
 * tenantId... and cannot leak across tenants"). Runs against the real dev
 * DB and the already-seeded example accounts (server/db/seed/examples.ts)
 * rather than mocking — per the same standard's instruction not to mock the
 * DB for exactly this class of flow.
 *
 * Requires `npm run db:seed` to have been run at least once so these
 * accounts exist: tenant admin at subdomain "contoh-aktif", and the App
 * Owner seeded from APP_OWNER_SEED_EMAIL/PASSWORD.
 */
const app = createApp();

const TENANT_SUBDOMAIN = "contoh-aktif";
const OTHER_SUBDOMAIN = "contoh-pending";
const TENANT_ADMIN_EMAIL = `admin@${TENANT_SUBDOMAIN}.contoh.local`;
const TENANT_ADMIN_PASSWORD = "ChangeMe123!";
const APP_OWNER_EMAIL = process.env.APP_OWNER_SEED_EMAIL || "owner@nusahr.local";
const APP_OWNER_PASSWORD = process.env.APP_OWNER_SEED_PASSWORD || "ChangeMe123!";

function originFor(subdomain: string | null) {
  const baseDomain = process.env.APP_BASE_DOMAIN || "localhost:3000";
  return subdomain ? `http://${subdomain}.${baseDomain}` : `http://${baseDomain}`;
}

describe("login subdomain isolation", () => {
  it("a tenant admin logs in successfully on their own subdomain", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", originFor(TENANT_SUBDOMAIN))
      .send({ email: TENANT_ADMIN_EMAIL, password: TENANT_ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("tenant_admin");
  });

  it("the same tenant admin is rejected on a DIFFERENT tenant's subdomain", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", originFor(OTHER_SUBDOMAIN))
      .send({ email: TENANT_ADMIN_EMAIL, password: TENANT_ADMIN_PASSWORD });
    expect(res.status).toBe(401);
  });

  it("a tenant admin is rejected on the bare App Owner domain", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", originFor(null))
      .send({ email: TENANT_ADMIN_EMAIL, password: TENANT_ADMIN_PASSWORD });
    expect(res.status).toBe(401);
  });

  it("the App Owner logs in successfully on the bare domain", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", originFor(null))
      .send({ email: APP_OWNER_EMAIL, password: APP_OWNER_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("app_owner");
  });

  it("the App Owner is rejected when logging in via any tenant subdomain", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", originFor(TENANT_SUBDOMAIN))
      .send({ email: APP_OWNER_EMAIL, password: APP_OWNER_PASSWORD });
    expect(res.status).toBe(401);
  });
});
