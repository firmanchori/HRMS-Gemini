import { and, eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { rolePermissionEntries, roleDefinitions } from "../db/schema.ts";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "export";

/**
 * Default role + permission rows a brand-new employee account can rely on
 * without an admin having to touch the RBAC matrix first — mirrors the
 * frontend's DEFAULT_ROLES fallback (HrmsContext.tsx) for the two system
 * roles that actually have real logins ("employee"/"manager"), scoped to
 * the "attendance" module (Presensi, Shift & Cuti — the same module key
 * the RBAC matrix UI uses, see RbacManagement.tsx's modulesList). Deny-by-
 * default otherwise: any other module/role combination with no row here
 * stays fully denied until an admin explicitly grants it.
 */
const DEFAULT_EMPLOYEE_ATTENDANCE_PERMISSIONS: Record<string, Partial<Record<PermissionAction, boolean>>> = {
  employee: { view: true, create: true },
  manager: { view: true, create: true, approve: true },
};

/** Seeds the two system roles + their default "attendance" permissions for a tenant, if it has none yet. No-ops once an admin has touched the matrix (role_definitions already has rows). */
export async function ensureDefaultEmployeeRbac(tenantId: string): Promise<void> {
  const existing = await db.select({ id: roleDefinitions.id }).from(roleDefinitions).where(eq(roleDefinitions.tenantId, tenantId)).limit(1);
  if (existing.length > 0) return;

  await db
    .insert(roleDefinitions)
    .values([
      { tenantId, id: "employee", label: "Staff (ESS)", description: "Portal mandiri: pengajuan cuti, presensi, reimbursement, & slip", badgeClass: "bg-slate-100 text-slate-800", isSystem: true },
      { tenantId, id: "manager", label: "Manager (MSS)", description: "Persetujuan berjenjang, monitoring kehadiran & cuti tim bawahan", badgeClass: "bg-emerald-100 text-emerald-800", isSystem: true },
    ])
    .onConflictDoNothing();

  await db
    .insert(rolePermissionEntries)
    .values(
      Object.entries(DEFAULT_EMPLOYEE_ATTENDANCE_PERMISSIONS).map(([roleKey, perms]) => ({
        tenantId,
        moduleKey: "attendance",
        roleKey,
        ...perms,
      }))
    )
    .onConflictDoNothing();
}

/** Reads one (moduleKey, roleKey) permission row — deny-all (every action false) when no row exists, never an exception; absence of configuration must never silently mean "allow everything". */
export async function getPermission(tenantId: string, moduleKey: string, roleKey: string) {
  const [row] = await db
    .select()
    .from(rolePermissionEntries)
    .where(and(eq(rolePermissionEntries.tenantId, tenantId), eq(rolePermissionEntries.moduleKey, moduleKey), eq(rolePermissionEntries.roleKey, roleKey)))
    .limit(1);
  return {
    view: row?.view ?? false,
    create: row?.create ?? false,
    edit: row?.edit ?? false,
    delete: row?.delete ?? false,
    approve: row?.approve ?? false,
    export: row?.export ?? false,
  };
}
