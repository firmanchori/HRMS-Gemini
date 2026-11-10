import { and, eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { officialDocuments, documentSignatoryConfigs } from "../db/schema.ts";

export type DocSignatory = typeof officialDocuments.$inferSelect["signatories"][number];

/** Vacuously complete when there are no required entries — the fallback in createOfficialDocumentRecord always creates one, so this only matters for rows migrated with an empty list. */
export function isFullySigned(signatories: DocSignatory[]): boolean {
  return signatories.filter((s) => s.isRequired).every((s) => s.confirmedAt);
}

export function buildVerificationUrl(documentNumber: string): string {
  const cleanNumber = documentNumber.replace(/[\/\s]/g, "-");
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `https://nusahr.enterprise/verify?doc=${cleanNumber}&h=${hash}`;
}

/**
 * The one place a document row is created (route handlers and server-side
 * flows like an approved Personalia SK both use it): signatories are copied
 * from the document type's config (fallback: the nominal signee), status
 * starts "Menunggu Tanda Tangan" with no QR until every required signatory
 * confirms — never client-supplied.
 */
export async function createOfficialDocumentRecord(params: {
  tenantId: string;
  data: {
    documentNumber: string;
    type: string;
    templateId?: string | null;
    title: string;
    targetEmployeeId?: string | null;
    issueDate: string;
    signeeName: string;
    signeeRole: string;
    contentPreview: string;
    renderedHtml?: string | null;
    isFromDocxTemplate?: boolean;
  };
}) {
  const { tenantId, data } = params;
  const configs = await db
    .select()
    .from(documentSignatoryConfigs)
    .where(and(eq(documentSignatoryConfigs.tenantId, tenantId), eq(documentSignatoryConfigs.documentType, data.type)))
    .orderBy(documentSignatoryConfigs.sortOrder);

  const signatories: DocSignatory[] =
    configs.length > 0
      ? configs.map((c) => ({ roleLabel: c.roleLabel, isRequired: c.isRequired, sortOrder: c.sortOrder, confirmedByEmployeeId: null, confirmedByName: null, confirmedAt: null }))
      : [{ roleLabel: data.signeeRole, isRequired: true, sortOrder: 0, confirmedByEmployeeId: null, confirmedByName: null, confirmedAt: null }];

  const alreadyComplete = isFullySigned(signatories);
  const [created] = await db
    .insert(officialDocuments)
    .values({
      ...data,
      tenantId,
      signatories,
      status: alreadyComplete ? "Resmi Diterbitkan" : "Menunggu Tanda Tangan",
      qrVerificationUrl: alreadyComplete ? buildVerificationUrl(data.documentNumber) : null,
    })
    .returning();
  return created;
}
