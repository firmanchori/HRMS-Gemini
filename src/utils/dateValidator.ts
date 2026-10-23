/**
 * Date Validator Utility for NusaHR Enterprise Forms
 */

export interface DateValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validates whether a given string is a valid ISO date (YYYY-MM-DD)
 * and actually exists on the calendar (e.g. rejects 2026-02-30)
 */
export function validateDateString(dateStr: string): DateValidationResult {
  if (!dateStr || dateStr.trim() === '') {
    return { isValid: false, errorMessage: 'Tanggal wajib diisi' };
  }

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return { isValid: false, errorMessage: 'Format tanggal harus YYYY-MM-DD' };
  }

  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (year < 1900 || year > 2100) {
    return { isValid: false, errorMessage: 'Tahun harus antara 1900 dan 2100' };
  }

  if (month < 1 || month > 12) {
    return { isValid: false, errorMessage: 'Bulan tidak valid (1-12)' };
  }

  // Days in month validation including leap year
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return {
      isValid: false,
      errorMessage: `Bulan ${month} pada tahun ${year} hanya memiliki ${daysInMonth} hari`,
    };
  }

  return { isValid: true };
}

/**
 * Validates that an end date does not precede a start date
 */
export function validateDateRange(startDateStr: string, endDateStr: string): DateValidationResult {
  const startCheck = validateDateString(startDateStr);
  if (!startCheck.isValid) return startCheck;

  const endCheck = validateDateString(endDateStr);
  if (!endCheck.isValid) return endCheck;

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (end < start) {
    return {
      isValid: false,
      errorMessage: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
    };
  }

  return { isValid: true };
}

/**
 * Validates employee birth date (cannot be future, must be at least minAge years old)
 */
export function validateBirthDate(birthDateStr: string, minAge: number = 17): DateValidationResult {
  const check = validateDateString(birthDateStr);
  if (!check.isValid) return check;

  const birthDate = new Date(birthDateStr);
  const today = new Date();

  if (birthDate > today) {
    return {
      isValid: false,
      errorMessage: 'Tanggal lahir tidak boleh di masa depan',
    };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < minAge) {
    return {
      isValid: false,
      errorMessage: `Usia karyawan minimal ${minAge} tahun (usia saat ini: ${age} tahun)`,
    };
  }

  return { isValid: true };
}
