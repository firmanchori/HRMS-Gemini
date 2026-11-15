/** Adds calendar months to a YYYY-MM-DD date, clamping to the last day of the target month (2026-12-31 + 6 months = 2027-06-30, not July 1). */
export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const total = m - 1 + months;
  const year = y + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`;
}

/** Today in Jakarta (the business timezone) as YYYY-MM-DD. */
export function todayWib(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/** Current wall-clock time in Jakarta: { date: "YYYY-MM-DD", time: "HH:MM", minutes: minutes since midnight }. The single source for "now" in attendance rules. */
export function nowWib(now = new Date()): { date: string; time: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((x) => x.type === t)!.value;
  const time = `${get("hour")}:${get("minute")}`;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Inclusive number of calendar days between two YYYY-MM-DD dates. */
export function daysInclusive(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
}
