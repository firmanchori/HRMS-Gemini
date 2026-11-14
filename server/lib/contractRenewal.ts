import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client.ts";
import { contractRenewalReviews, employees } from "../db/schema.ts";
import { createOfficialDocumentRecord } from "./documents.ts";
import { logAudit } from "./audit.ts";
import { addMonths, todayWib } from "./dates.ts";


/**
 * Applies an APPROVED contract-renewal review to the employee on the server
 * (previously the browser did it, with "30 days × months" arithmetic and the
 * proposed salary lost in free-text notes). Idempotent via appliedAt. "Tidak
 * Diperpanjang" changes nothing here — separation goes through Offboarding.
 */
export async function applyContractRenewalReview(reviewId: string, approvedBy: string) {
  const [claimed] = await db
    .update(contractRenewalReviews)
    .set({ appliedAt: new Date() })
    .where(and(eq(contractRenewalReviews.id, reviewId), isNull(contractRenewalReviews.appliedAt)))
    .returning();
  if (!claimed) return;
  try {
    if (claimed.recommendation === "Tidak Diperpanjang") return;
    const [emp] = await db.select().from(employees).where(eq(employees.id, claimed.employeeId)).limit(1);
    if (!emp) return;
    const details: Record<string, unknown> = { ...(emp.details as Record<string, unknown>) };
    const columns: Partial<typeof employees.$inferInsert> = {};
    const start = claimed.effectiveDate || todayWib();
    const currentEnd = claimed.currentContractEnd.toISOString().slice(0, 10);
    const docNumber = claimed.newContractDocNumber || `${claimed.recommendation === "Perpanjang PKWT" ? "PKWT" : "PKWTT"}/${new Date().getFullYear()}/${claimed.id.slice(0, 6).toUpperCase()}`;
    if (claimed.newSalary != null) columns.basicSalary = claimed.newSalary;

    let docType: string;
    let title: string;
    let content: string;
    if (claimed.recommendation === "Perpanjang PKWT") {
      const base = currentEnd > start ? currentEnd : start;
      const newEnd = addMonths(base, claimed.newDurationMonths || 12);
      details.contractEndDate = newEnd;
      details.contractStartDate = start;
      details.contractDocNumber = docNumber;
      docType = "PKWT";
      title = `Perpanjangan Perjanjian Kerja Waktu Tertentu: ${emp.fullName}`;
      content = `Memperpanjang masa kerja kontrak atas nama ${emp.fullName} hingga ${newEnd}.`;
    } else {
      columns.employmentType = "Tetap";
      details.probationStatus = "Lolos";
      details.permanentAppointmentDate = start;
      details.contractDocNumber = docNumber;
      delete details.contractEndDate;
      docType = "PKWTT";
      title = `Surat Pengangkatan Karyawan Tetap: ${emp.fullName}`;
      content = `Mengangkat ${emp.fullName} sebagai Karyawan Tetap terhitung ${start}.`;
    }
    await db.update(employees).set({ ...columns, details }).where(eq(employees.id, emp.id));
    const doc = await createOfficialDocumentRecord({
      tenantId: claimed.tenantId,
      data: { documentNumber: docNumber, type: docType, title, targetEmployeeId: emp.id, issueDate: start, signeeName: approvedBy, signeeRole: "VP Human Resources", contentPreview: content },
    });
    await logAudit({ actorUserId: null, tenantId: claimed.tenantId, action: "contract_renewal.applied", details: { reviewId: claimed.id, employeeId: emp.id, recommendation: claimed.recommendation, documentId: doc.id, salaryChanged: claimed.newSalary != null } });
  } catch (err) {
    await db.update(contractRenewalReviews).set({ appliedAt: null }).where(eq(contractRenewalReviews.id, reviewId));
    throw err;
  }
}
