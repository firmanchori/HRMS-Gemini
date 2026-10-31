import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../client.ts";
import {
  subscriptionPlans,
  tenants,
  tenantSubscriptions,
  users,
  paymentVerifications,
  promotions,
  affiliates,
  contactInquiries,
  contactReplies,
  subscriptionUsageEvents,
  bankAccounts,
} from "../schema.ts";

/**
 * Example/demo data for every App Owner menu ("Buat semua contoh untuk
 * masing-masing module/menu") so each tab shows something real instead of
 * an empty state on first look. Idempotent — skips whatever already exists.
 */
async function seedExampleTenants() {
  const [starter] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, "Starter")).limit(1);
  const [pro] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, "Professional")).limit(1);
  if (!starter || !pro) return console.log("Preset plans belum ada, skip contoh tenant.");

  const examples: {
    tenantName: string;
    subdomain: string;
    plan: typeof starter;
    status: "Active" | "PendingPayment";
    actualUsers: number;
    actualEntities: number;
  }[] = [
    { tenantName: "PT Contoh Sejahtera", subdomain: "contoh-aktif", plan: pro, status: "Active", actualUsers: 50, actualEntities: 1 },
    { tenantName: "CV Mitra Baru", subdomain: "contoh-pending", plan: starter, status: "PendingPayment", actualUsers: 15, actualEntities: 1 },
  ];

  for (const ex of examples) {
    const [existing] = await db.select().from(tenants).where(eq(tenants.subdomain, ex.subdomain)).limit(1);
    if (existing) {
      console.log(`Tenant contoh '${ex.subdomain}' sudah ada, skip.`);
      continue;
    }

    const [tenant] = await db
      .insert(tenants)
      .values({ name: ex.tenantName, subdomain: ex.subdomain, planId: ex.plan.id, status: ex.status })
      .returning();

    const startedAt = ex.status === "Active" ? new Date() : null;
    const expiresAt = ex.status === "Active" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null;
    const [subscription] = await db
      .insert(tenantSubscriptions)
      .values({
        tenantId: tenant.id,
        planId: ex.plan.id,
        committedMonths: 12,
        status: ex.status,
        startedAt,
        expiresAt,
        actualUsers: ex.actualUsers,
        actualEntities: ex.actualEntities,
      })
      .returning();

    await db.insert(subscriptionUsageEvents).values([
      ...Array.from({ length: ex.actualUsers }, () => ({ tenantSubscriptionId: subscription.id, resourceType: "user" as const })),
      ...Array.from({ length: ex.actualEntities }, () => ({ tenantSubscriptionId: subscription.id, resourceType: "entity" as const })),
    ]);

    const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
    await db.insert(users).values({
      tenantId: tenant.id,
      role: "tenant_admin",
      name: `Admin ${ex.tenantName}`,
      email: `admin@${ex.subdomain}.contoh.local`,
      passwordHash,
    });

    if (ex.status === "PendingPayment") {
      await db.insert(paymentVerifications).values({
        tenantId: tenant.id,
        amountIdr: ex.plan.priceIdr * 12,
        bankName: "BCA",
        referenceNumber: "TRX-CONTOH-001",
        note: "Contoh bukti transfer menunggu verifikasi.",
      });
    }

    console.log(`Tenant contoh '${ex.tenantName}' (${ex.status}) dibuat.`);
  }
}

async function seedExamplePromotionsAndAffiliates() {
  const [starter] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, "Starter")).limit(1);
  if (!starter) return;

  const [existingPromo] = await db.select().from(promotions).where(eq(promotions.code, "CONTOH10")).limit(1);
  if (!existingPromo) {
    await db.insert(promotions).values({
      planId: starter.id,
      code: "CONTOH10",
      name: "Contoh Promo 10%",
      discountPercent: 10,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      maxUses: 100,
    });
    console.log("Contoh promo 'CONTOH10' dibuat.");
  }

  const [existingAffiliate] = await db.select().from(affiliates).where(eq(affiliates.code, "MITRA01")).limit(1);
  if (!existingAffiliate) {
    await db.insert(affiliates).values({
      planId: starter.id,
      code: "MITRA01",
      affiliateName: "Mitra Contoh",
      customerDiscountPercent: 5,
      commissionPercent: 10,
    });
    console.log("Contoh affiliate 'MITRA01' dibuat.");
  }
}

async function seedExampleContactInquiries() {
  const [existing] = await db.select().from(contactInquiries).where(eq(contactInquiries.subject, "Pertanyaan Demo Produk")).limit(1);
  if (existing) return console.log("Contoh pesan kontak sudah ada, skip.");

  const [newInquiry] = await db
    .insert(contactInquiries)
    .values({ name: "Budi Santoso", email: "budi@contoh.local", subject: "Pertanyaan Demo Produk", message: "Apakah tersedia demo untuk 100 karyawan?", status: "New" })
    .returning();
  console.log(`Contoh pesan kontak baru '${newInquiry.subject}' dibuat.`);

  const [owner] = await db.select().from(users).where(eq(users.role, "app_owner")).limit(1);
  const [repliedInquiry] = await db
    .insert(contactInquiries)
    .values({ name: "Sari Dewi", email: "sari@contoh.local", subject: "Perpanjangan Paket", message: "Bagaimana cara upgrade dari Starter ke Professional?", status: "Replied" })
    .returning();
  if (owner) {
    await db.insert(contactReplies).values({
      inquiryId: repliedInquiry.id,
      body: "Halo Sari, Anda bisa upgrade langsung dari menu Pengaturan Akun pada aplikasi tenant Anda.",
      sentByUserId: owner.id,
    });
  }
  console.log(`Contoh pesan kontak terbalas '${repliedInquiry.subject}' dibuat.`);
}

async function seedExampleBankAccounts() {
  const existing = await db.select().from(bankAccounts);
  if (existing.length > 0) return console.log("Rekening bank sudah ada, skip.");

  await db.insert(bankAccounts).values([
    { bankName: "BCA", accountNumber: "1234567890", accountHolderName: "PT NusaHR Teknologi" },
    { bankName: "Mandiri", accountNumber: "0987654321", accountHolderName: "PT NusaHR Teknologi" },
  ]);
  console.log("Contoh rekening bank (BCA, Mandiri) dibuat.");
}

export async function seedExamples() {
  await seedExampleBankAccounts();
  await seedExampleTenants();
  await seedExamplePromotionsAndAffiliates();
  await seedExampleContactInquiries();
}
