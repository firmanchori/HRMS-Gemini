/**
 * The app's master document catalog (44 templates: PKWT/PKWTT, SK Promosi/
 * Mutasi/Demosi, SP 1-3, SPPD, Paklaring, slip gaji, BAST aset, formulir
 * cuti/lembur/reimbursement, PR/PO/quotation, FPTK, dsb) is authored once
 * in the frontend mock data (src/data/initialData.ts's
 * INITIAL_DOCUMENT_TEMPLATES) and reused here as the single source of
 * truth — imported directly rather than duplicated, so editing the
 * catalog only ever happens in one place.
 *
 * Found missing (user, 2026-11-09): when Document Management was migrated
 * to a real per-tenant backend table earlier this session, nothing ever
 * seeded a tenant's copy of this catalog — every tenant started with zero
 * templates, when the product requirement is that every tenant gets their
 * OWN independent copy of the full default catalog at setup time (a
 * one-time copy they can then edit/delete freely, same "dead copy, not a
 * live link" pattern already used for entity settings inheritance
 * elsewhere in this schema — never re-synced from the catalog later).
 */
import { INITIAL_DOCUMENT_TEMPLATES } from "../../src/data/initialData.ts";
import { db } from "../db/client.ts";
import { documentTemplates } from "../db/schema.ts";
import { eq } from "drizzle-orm";

/**
 * Seeds tenantId's copy of the default document catalog — but only if it
 * doesn't already have ANY templates, so this is safe to call
 * unconditionally (e.g. from the "create a tenant's root entity" route)
 * without risking duplicate rows on a retry. letterHeadTitle/
 * letterHeadAddress are overridden to the entity's own name/address
 * (falling back to the catalog's own value only if the entity's own
 * field is empty) — the catalog's checked-in copy is authored against the
 * demo tenant's company name, which must never leak into a real tenant's
 * documents.
 */
export async function seedDefaultDocumentTemplatesForTenant(
  tenantId: string,
  entity: { name: string; address: string | null }
): Promise<number> {
  const existing = await db.select({ id: documentTemplates.id }).from(documentTemplates).where(eq(documentTemplates.tenantId, tenantId)).limit(1);
  if (existing.length > 0) return 0;

  const rows = INITIAL_DOCUMENT_TEMPLATES.map((t) => ({
    tenantId,
    type: t.type,
    name: t.name,
    numberingPattern: t.numberingPattern,
    paperSize: t.paperSize ?? null,
    letterHeadTitle: entity.name || t.letterHeadTitle,
    letterHeadAddress: entity.address || t.letterHeadAddress,
    letterHeadNpwp: t.letterHeadNpwp ?? null,
    letterHeadPhone: t.letterHeadPhone ?? null,
    letterHeadEmail: t.letterHeadEmail ?? null,
    defaultBody: t.defaultBody,
    showQrSignature: t.showQrSignature,
    signeeTitle: t.signeeTitle,
    signeeRole: t.signeeRole,
    sourceType: "system" as const,
    fileName: null,
    fileSize: null,
    uploadedAt: null,
    rawHtmlTemplate: t.rawHtmlTemplate ?? null,
    extractedPlaceholders: t.extractedPlaceholders ?? null,
    kopPosition: t.kopPosition ?? null,
    qrPosition: t.qrPosition ?? null,
    footerText: t.footerText ?? null,
  }));

  await db.insert(documentTemplates).values(rows);
  return rows.length;
}
