import { eq, and } from "drizzle-orm";
import { db } from "../client.ts";
import { tenants, employees, workShifts, employeeSchedules, attendanceRecords } from "../schema.ts";

/** Standard shift catalog — mirrors src/data/initialData.ts INITIAL_SHIFTS, kept as a plain literal since server seeds can't import frontend modules. */
const WORK_SHIFT_SEED = [
  { name: "Shift Normal Office", code: "SH-NOR", startTime: "08:00", endTime: "17:00", color: "#6366f1", isNightShift: false, lateToleranceMins: 15 },
  { name: "Shift Pagi (Early)", code: "SH-PAGI", startTime: "07:00", endTime: "16:00", color: "#10b981", isNightShift: false, lateToleranceMins: 10 },
  { name: "Shift Siang / Support", code: "SH-SIANG", startTime: "13:00", endTime: "22:00", color: "#f59e0b", isNightShift: false, lateToleranceMins: 15 },
  { name: "Shift Malam (Ops & Sec)", code: "SH-MALAM", startTime: "21:00", endTime: "06:00", color: "#8b5cf6", isNightShift: true, lateToleranceMins: 15 },
];

async function seedWorkShiftDefaults() {
  const allTenants = await db.select().from(tenants);
  for (const tenant of allTenants) {
    const [existing] = await db.select().from(workShifts).where(eq(workShifts.tenantId, tenant.id)).limit(1);
    if (existing) continue;
    await db.insert(workShifts).values(WORK_SHIFT_SEED.map((s) => ({ tenantId: tenant.id, ...s })));
  }
  console.log(`Master shift standar disiapkan untuk ${allTenants.length} tenant.`);
}

/** Sample roster + attendance record for PT Contoh, using the already-seeded "Siti Rahma" employee. */
async function seedAttendanceSamplesForContoh() {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, "contoh")).limit(1);
  if (!tenant) return console.log("Tenant 'contoh' belum ada, skip contoh data presensi.");

  const [emp] = await db.select().from(employees).where(and(eq(employees.tenantId, tenant.id), eq(employees.fullName, "Siti Rahma"))).limit(1);
  if (!emp) return console.log("Karyawan contoh 'Siti Rahma' belum ada, skip contoh presensi.");

  const [existingSchedule] = await db.select().from(employeeSchedules).where(eq(employeeSchedules.employeeId, emp.id)).limit(1);
  if (existingSchedule) return console.log("Contoh roster/presensi untuk tenant 'contoh' sudah ada, skip.");

  const [normShift] = await db.select().from(workShifts).where(and(eq(workShifts.tenantId, tenant.id), eq(workShifts.code, "SH-NOR"))).limit(1);
  if (!normShift) return console.log("Master shift belum ada, skip contoh roster.");

  const today = new Date().toISOString().split("T")[0];

  await db.insert(employeeSchedules).values({ tenantId: tenant.id, employeeId: emp.id, date: today, shiftId: normShift.id });
  await db.insert(attendanceRecords).values({
    tenantId: tenant.id,
    employeeId: emp.id,
    date: today,
    clockIn: "08:05",
    clockOut: "17:10",
    status: "Hadir",
    overtimeHours: 0,
    lateMinutes: 0,
    notes: "Presensi contoh",
    shiftId: normShift.id,
  });

  console.log("Contoh roster & presensi untuk tenant 'contoh' disiapkan.");
}

export async function seedAttendanceExamples() {
  await seedWorkShiftDefaults();
  await seedAttendanceSamplesForContoh();
}
