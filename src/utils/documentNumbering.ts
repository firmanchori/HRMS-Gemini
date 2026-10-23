export function toRomanNumeral(num: number): string {
  const lookup: Record<string, number> = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let roman = '';
  for (const i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
}

export function generateDocumentNumber(
  type: string,
  sequenceIndex: number,
  tenantCode: string,
  date: Date = new Date()
): string {
  const seqStr = String(sequenceIndex).padStart(3, '0');
  const month = date.getMonth() + 1;
  const romanMonth = toRomanNumeral(month);
  const year = date.getFullYear();

  let codePrefix = 'DOC';
  switch (type) {
    case 'PKWT':
      codePrefix = 'PKWT';
      break;
    case 'PKWTT':
      codePrefix = 'PKWTT';
      break;
    case 'Surat Promosi':
      codePrefix = 'SK-PROM';
      break;
    case 'Surat Peringatan':
      codePrefix = 'SP';
      break;
    case 'Parklaring':
      codePrefix = 'SKK';
      break;
    case 'BAST Aset':
      codePrefix = 'BAST-GA';
      break;
    case 'Offering Letter':
      codePrefix = 'OL';
      break;
    case 'Surat Tugas Dinas':
    case 'Surat Perintah Perjalanan Dinas':
      codePrefix = 'SPPD';
      break;
  }

  // Format baku enterprise Indonesia: 001/HRD-PKWT/NTM/X/2026
  return `${seqStr}/HRD-${codePrefix}/${tenantCode}/${romanMonth}/${year}`;
}
