import { MigrationRowPreview } from '../types/hrms';

export const SAMPLE_EMPLOYEE_CSV = `NIK,Nama,Email,NoHP,Status,Departemen,Jabatan,Grade,TanggalMasuk,PTKP,NPWP,GajiPokok,TunjanganTetap,SaldoCuti
NTM-2024-001,Budi Santoso,budi.santoso@nusantara.id,081234567890,Tetap,Engineering,Senior Software Engineer,L4,2022-03-01,K/1,12.345.678.9-012.000,16500000,2500000,12
NTM-2024-002,Siti Rahmawati,siti.rahma@nusantara.id,081234567891,Tetap,Human Resources,HR Operations Lead,L3,2023-01-15,TK/0,23.456.789.0-123.000,12000000,1500000,10
NTM-2024-003,Ahmad Fauzi,ahmad.fauzi@nusantara.id,081234567892,Kontrak,Operations,Warehouse Specialist,L2,2024-05-10,K/0,34.567.890.1-234.000,6500000,500000,8
NTM-2024-004,Dewi Lestari,dewi.lestari@nusantara.id,081234567893,Outsource,General Affairs,Facility Coordinator,L1,2024-08-01,TK/1,45.678.901.2-345.000,5200000,300000,6
NTM-2024-005,Rian Hidayat,rian.hidayat@nusantara.id,081234567894,Tetap,Finance,Tax & Accounting Specialist,L3,2023-09-01,TK/2,56.789.012.3-456.000,11000000,1200000,11`;

export function downloadCSV(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseEmployeeCSV(csvText: string): MigrationRowPreview[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows: MigrationRowPreview[] = [];
  const seenNIKs = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map((v) => v.trim());
    const rowMap: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowMap[h] = values[idx] || '';
    });

    const nik = rowMap['nik'] || `MIG-${i}`;
    const nama = rowMap['nama'] || rowMap['fullname'] || '';
    const email = rowMap['email'] || '';
    const status = rowMap['status'] || 'Tetap';
    const departemen = rowMap['departemen'] || rowMap['department'] || 'General';
    const jabatan = rowMap['jabatan'] || rowMap['position'] || 'Staff';
    const gajiPokok = parseFloat(rowMap['gajipokok'] || rowMap['basicsalary'] || '0') || 0;
    const ptkp = rowMap['ptkp'] || 'TK/0';
    const saldoCuti = parseInt(rowMap['saldocuti'] || '12', 10) || 12;

    let isValid = true;
    let validationError = '';

    if (!nama) {
      isValid = false;
      validationError = 'Nama karyawan wajib diisi';
    } else if (seenNIKs.has(nik)) {
      isValid = false;
      validationError = `NIK duplikat: ${nik}`;
    } else if (!email.includes('@')) {
      isValid = false;
      validationError = 'Format email tidak valid';
    } else if (gajiPokok <= 0) {
      isValid = false;
      validationError = 'Gaji pokok harus bernilai positif';
    }

    seenNIKs.add(nik);

    rows.push({
      nik,
      nama,
      email,
      status,
      departemen,
      jabatan,
      gajiPokok,
      ptkp,
      saldoCuti,
      isValid,
      validationError,
    });
  }

  return rows;
}
