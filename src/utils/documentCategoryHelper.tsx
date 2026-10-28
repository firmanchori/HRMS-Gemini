import React from 'react';
import {
  Briefcase,
  Award,
  GraduationCap,
  Clock,
  Coins,
  ShieldAlert,
  Package,
} from 'lucide-react';

export type TemplateCategory =
  | 'Perjanjian Kerja & Kontrak'
  | 'Karier & Organisasi'
  | 'Magang Industri'
  | 'Kehadiran, Cuti & Perjalanan Dinas'
  | 'Payroll, Pajak & BPJS'
  | 'Disiplin, PHK & Paklaring'
  | 'Pengadaan, Aset & Umum (GA)';

export const TEMPLATE_CATEGORIES: {
  id: TemplateCategory;
  label: string;
  badgeColor: string;
  description: string;
}[] = [
  {
    id: 'Perjanjian Kerja & Kontrak',
    label: 'Perjanjian Kerja & Kontrak',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'PKWT, PKWTT, Addendum, Offering Letter, Non-Disclosure Agreement (NDA), dan SK Tenaga Ahli.',
  },
  {
    id: 'Karier & Organisasi',
    label: 'Karier & Organisasi',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Promosi, Mutasi, Demosi, Penetapan Plt, dan Evaluasi Kinerja Karyawan (KPI & OKR).',
  },
  {
    id: 'Magang Industri',
    label: 'Magang Industri',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Sertifikat Kelulusan Magang dan Surat Pernyataan Kesepakatan Program Magang Kerja.',
  },
  {
    id: 'Kehadiran, Cuti & Perjalanan Dinas',
    label: 'Kehadiran, Cuti & Dinas',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'SPPD, Rekap Presensi Cut-off, Formulir Izin/Cuti/Sakit, Koreksi Presensi, dan Surat Lembur (SPKL).',
  },
  {
    id: 'Payroll, Pajak & BPJS',
    label: 'Payroll, Pajak & BPJS',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Slip Gaji (A4/A5), Pendaftaran BPJS e-Dabu & SIPP, Bukti Potong Pajak Coretax, Klaim Biaya, dan Pinjaman Karyawan.',
  },
  {
    id: 'Disiplin, PHK & Paklaring',
    label: 'Disiplin, PHK & Paklaring',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Surat Peringatan (SP 1/2/3), Sanksi Disiplin Resmi, SK PHK, dan Surat Pengalaman Kerja (Parklaring).',
  },
  {
    id: 'Pengadaan, Aset & Umum (GA)',
    label: 'Pengadaan, Aset & GA',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'BAST Aset, Form Tiketing IT, Peminjaman Ruang & Mobil Dinas, ATK, Purchase Order (PO), Quotation, Kontrak Vendor, dan Hardware.',
  },
];

export const getTemplateCategory = (tmpl: { type?: string; name?: string }): TemplateCategory => {
  const norm = `${tmpl?.type || ''} ${tmpl?.name || ''}`.toLowerCase();

  if (norm.includes('magang') || norm.includes('intern')) {
    return 'Magang Industri';
  }
  if (
    norm.includes('pkwt') ||
    norm.includes('pkwtt') ||
    norm.includes('kontrak kerja') ||
    norm.includes('offering') ||
    norm.includes('nda') ||
    norm.includes('kerahasiaan') ||
    norm.includes('tenaga ahli') ||
    norm.includes('konsultan') ||
    norm.includes('medical check') ||
    norm.includes('mcu')
  ) {
    return 'Perjanjian Kerja & Kontrak';
  }
  if (
    norm.includes('promosi') ||
    norm.includes('mutasi') ||
    norm.includes('demosi') ||
    norm.includes('plt') ||
    norm.includes('acting') ||
    norm.includes('kpi') ||
    norm.includes('okr') ||
    norm.includes('kinerja') ||
    norm.includes('fptk') ||
    norm.includes('tenaga kerja')
  ) {
    return 'Karier & Organisasi';
  }
  if (
    norm.includes('sppd') ||
    norm.includes('perjalanan dinas') ||
    norm.includes('presensi') ||
    norm.includes('cuti') ||
    norm.includes('lembur') ||
    norm.includes('izin') ||
    norm.includes('sakit') ||
    norm.includes('kehadiran')
  ) {
    return 'Kehadiran, Cuti & Perjalanan Dinas';
  }
  if (
    norm.includes('gaji') ||
    norm.includes('payslip') ||
    norm.includes('payroll') ||
    norm.includes('bpjs') ||
    norm.includes('edabu') ||
    norm.includes('e-dabu') ||
    norm.includes('sipp') ||
    norm.includes('pajak') ||
    norm.includes('coretax') ||
    norm.includes('bupot') ||
    norm.includes('klaim') ||
    norm.includes('reimburse') ||
    norm.includes('pinjaman') ||
    norm.includes('kasbon') ||
    norm.includes('angsuran')
  ) {
    return 'Payroll, Pajak & BPJS';
  }
  if (
    norm.includes('peringatan') ||
    norm.includes('sp-') ||
    norm.includes('sp 1') ||
    norm.includes('sp 2') ||
    norm.includes('sp 3') ||
    norm.includes('disiplin') ||
    norm.includes('phk') ||
    norm.includes('pengakhiran') ||
    norm.includes('paklaring') ||
    norm.includes('parklaring') ||
    norm.includes('pengalaman kerja')
  ) {
    return 'Disiplin, PHK & Paklaring';
  }
  return 'Pengadaan, Aset & Umum (GA)';
};

export const renderCategoryIcon = (cat: TemplateCategory | string, className = 'w-4 h-4') => {
  switch (cat) {
    case 'Perjanjian Kerja & Kontrak':
      return <Briefcase className={className} />;
    case 'Karier & Organisasi':
      return <Award className={className} />;
    case 'Magang Industri':
      return <GraduationCap className={className} />;
    case 'Kehadiran, Cuti & Perjalanan Dinas':
      return <Clock className={className} />;
    case 'Payroll, Pajak & BPJS':
      return <Coins className={className} />;
    case 'Disiplin, PHK & Paklaring':
      return <ShieldAlert className={className} />;
    case 'Pengadaan, Aset & Umum (GA)':
    default:
      return <Package className={className} />;
  }
};
