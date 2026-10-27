import mammoth from 'mammoth';
import { Employee, Tenant } from '../types/hrms';
import { formatRupiah, getTERCategory } from './taxCalculator';

export interface ParsedDocxResult {
  html: string;
  rawText: string;
  placeholders: string[];
  fileName: string;
  fileSize: string;
}

export interface KnownVariableMeta {
  label: string;
  example: string;
  category?: string;
}

export const KNOWN_VARIABLE_DESCRIPTIONS: Record<string, KnownVariableMeta> = {
  // 1. Identitas Karyawan
  nama: { label: 'Nama Lengkap Karyawan', example: 'Raditya Pratama, S.T.', category: 'Identitas Karyawan' },
  nik: { label: 'Nomor Induk Karyawan', example: 'NTM-2024-001', category: 'Identitas Karyawan' },
  nik_ktp: { label: 'Nomor KTP (16 Digit)', example: '3174081205930002', category: 'Identitas Karyawan' },
  no_kk: { label: 'Nomor Kartu Keluarga', example: '3174080101150006', category: 'Identitas Karyawan' },
  alamat_karyawan: { label: 'Alamat Domisili Karyawan', example: 'Jl. Sudirman No. 10, Jakarta', category: 'Identitas Karyawan' },
  nomor_telepon: { label: 'Nomor Telepon / WhatsApp Karyawan', example: '0812-9876-5432', category: 'Identitas Karyawan' },
  rekening: { label: 'Rekening Payroll Karyawan', example: 'BCA 8830192831 a.n Raditya Pratama', category: 'Identitas Karyawan' },
  npwp: { label: 'NPWP Karyawan (15 Digit)', example: '12.345.678.9-012.000', category: 'Identitas Karyawan' },
  npwp_karyawan_16: { label: 'NPWP 16 Digit (NIK / Coretax)', example: '3174081205930002', category: 'Identitas Karyawan' },
  ptkp: { label: 'Status PTKP Pajak & TER', example: 'TK/0 (TER Kategori A)', category: 'Identitas Karyawan' },
  nilai_ptkp: { label: 'Nilai Nominal PTKP Tahunan', example: 'Rp 54.000.000', category: 'Identitas Karyawan' },
  nomor_darurat: { label: 'Kontak / Nomor Darurat', example: '0813-1122-3344 (Istri)', category: 'Identitas Karyawan' },

  // 2. Kepegawaian & Penempatan
  jabatan: { label: 'Jabatan / Posisi Kerja', example: 'Lead Cloud Architect', category: 'Kepegawaian & Kontrak' },
  departemen: { label: 'Departemen / Divisi', example: 'Engineering & Technology', category: 'Kepegawaian & Kontrak' },
  grade: { label: 'Grade Golongan', example: 'L3', category: 'Kepegawaian & Kontrak' },
  status_kerja: { label: 'Status Hubungan Kerja', example: 'Karyawan Tetap (PKWTT)', category: 'Kepegawaian & Kontrak' },
  tanggal_mulai: { label: 'Tanggal Mulai Bertugas / Kontrak', example: '01 Januari 2026', category: 'Kepegawaian & Kontrak' },
  tanggal_berakhir: { label: 'Tanggal Berakhir Kontrak', example: '31 Desember 2026', category: 'Kepegawaian & Kontrak' },
  skema_kerja: { label: 'Skema Kerja (WFO/WFH/Hybrid)', example: 'Hybrid 3 Hari Kantor', category: 'Kepegawaian & Kontrak' },
  lokasi_kerja: { label: 'Lokasi Kerja / Penempatan', example: 'Kantor Pusat Menara Palma Jakarta', category: 'Kepegawaian & Kontrak' },
  nama_pengganti: { label: 'Nama Karyawan Pelimpahan / Pengganti', example: 'Siti Rahmawati, S.Kom', category: 'Kepegawaian & Kontrak' },
  nik_pengganti: { label: 'NIK Karyawan Pengganti', example: 'NTM-2024-018', category: 'Kepegawaian & Kontrak' },

  // 3. Kompensasi, Payroll & Pajak
  gaji_pokok: { label: 'Gaji Pokok Bulanan (IDR)', example: 'Rp 15.000.000', category: 'Payroll, Pajak & BPJS' },
  gaji_terbilang: { label: 'Gaji Pokok Terbilang', example: 'Lima Belas Juta Rupiah', category: 'Payroll, Pajak & BPJS' },
  tunjangan_tetap: { label: 'Tunjangan Tetap / Jabatan', example: 'Rp 3.500.000', category: 'Payroll, Pajak & BPJS' },
  tunjangan_makan: { label: 'Tunjangan Makan & Transport', example: 'Rp 1.500.000', category: 'Payroll, Pajak & BPJS' },
  upah_lembur: { label: 'Upah Lembur Bulanan', example: 'Rp 750.000', category: 'Payroll, Pajak & BPJS' },
  total_bruto: { label: 'Total Penghasilan Bruto', example: 'Rp 20.750.000', category: 'Payroll, Pajak & BPJS' },
  total_potongan: { label: 'Total Potongan Gaji', example: 'Rp 1.450.000', category: 'Payroll, Pajak & BPJS' },
  thp_bersih: { label: 'Take Home Pay (THP) Bersih', example: 'Rp 19.300.000', category: 'Payroll, Pajak & BPJS' },
  thp_terbilang: { label: 'THP Bersih Terbilang', example: 'Sembilan Belas Juta Tiga Ratus Ribu Rupiah', category: 'Payroll, Pajak & BPJS' },
  periode_gaji: { label: 'Periode Pembayaran Gaji', example: 'Oktober 2026', category: 'Payroll, Pajak & BPJS' },
  potongan_kasbon: { label: 'Potongan Kasbon / Pinjaman', example: 'Rp 1.000.000', category: 'Payroll, Pajak & BPJS' },
  potongan_pph21: { label: 'Potongan PPh 21 Bulanan', example: 'Rp 450.000', category: 'Payroll, Pajak & BPJS' },
  penghasilan_bruto: { label: 'Penghasilan Bruto Pajak Coretax', example: 'Rp 240.000.000', category: 'Payroll, Pajak & BPJS' },
  biaya_jabatan: { label: 'Biaya Jabatan (Maksimal Rp 6jt/thn)', example: 'Rp 6.000.000', category: 'Payroll, Pajak & BPJS' },
  iuran_pensiun: { label: 'Iuran Pensiun / JHT / JP', example: 'Rp 7.200.000', category: 'Payroll, Pajak & BPJS' },
  penghasilan_neto_tahunan: { label: 'Penghasilan Neto Setahun', example: 'Rp 226.800.000', category: 'Payroll, Pajak & BPJS' },
  pkp_tahunan: { label: 'Penghasilan Kena Pajak (PKP)', example: 'Rp 172.800.000', category: 'Payroll, Pajak & BPJS' },
  tarif_pajak_persen: { label: 'Tarif Pajak Efektif Coretax', example: '15%', category: 'Payroll, Pajak & BPJS' },
  pph21_terutang: { label: 'PPh Pasal 21 Terutang Setahun', example: 'Rp 21.420.000', category: 'Payroll, Pajak & BPJS' },
  pph21_terbilang: { label: 'PPh 21 Terutang Terbilang', example: 'Dua Puluh Satu Juta Empat Ratus Dua Puluh Ribu Rupiah', category: 'Payroll, Pajak & BPJS' },
  masa_pajak: { label: 'Masa Pajak Penghasilan', example: '10 (Oktober)', category: 'Payroll, Pajak & BPJS' },
  tahun_pajak: { label: 'Tahun Pajak', example: '2026', category: 'Payroll, Pajak & BPJS' },
  nomor_faktur_pajak: { label: 'Nomor Bukti Potong Pajak Coretax', example: 'BUPOT-2026-X-00042', category: 'Payroll, Pajak & BPJS' },
  nilai_bruto: { label: 'Nilai Bruto Pembayaran', example: 'Rp 30.000.000', category: 'Payroll, Pajak & BPJS' },

  // 4. BPJS Kesehatan & Ketenagakerjaan
  nomor_bpjskes: { label: 'Nomor Kartu BPJS Kesehatan', example: '0001829381023', category: 'Payroll, Pajak & BPJS' },
  nomor_bpjstk: { label: 'Nomor KPJ BPJS Ketenagakerjaan', example: '19028391823', category: 'Payroll, Pajak & BPJS' },
  jenis_tindakan_bpjs: { label: 'Jenis Permohonan BPJS (Baru/Pindah)', example: 'Pendaftaran Kepesertaan Baru (e-Dabu)', category: 'Payroll, Pajak & BPJS' },
  kode_badan_usaha: { label: 'Kode Badan Usaha BPJS', example: '01928374 (PT Nusantara Teknologi Mandiri)', category: 'Payroll, Pajak & BPJS' },
  potongan_bpjskes: { label: 'Potongan Iuran BPJS Kesehatan (1%)', example: 'Rp 150.000', category: 'Payroll, Pajak & BPJS' },
  potongan_bpjstk: { label: 'Potongan Iuran BPJS Ketenagakerjaan (3%)', example: 'Rp 450.000', category: 'Payroll, Pajak & BPJS' },

  // 5. Pinjaman Karyawan & Angsuran
  jumlah_pinjaman: { label: 'Jumlah Pokok Pinjaman Karyawan', example: 'Rp 12.000.000', category: 'Payroll, Pajak & BPJS' },
  jumlah_terbilang: { label: 'Jumlah Pokok Pinjaman Terbilang', example: 'Dua Belas Juta Rupiah', category: 'Payroll, Pajak & BPJS' },
  tenor_bulan: { label: 'Jangka Waktu Tenor Cicilan (Bulan)', example: '12 Bulan', category: 'Payroll, Pajak & BPJS' },
  angsuran_per_bulan: { label: 'Angsuran Potong Gaji per Bulan', example: 'Rp 1.000.000', category: 'Payroll, Pajak & BPJS' },
  angsuran_terbilang: { label: 'Angsuran per Bulan Terbilang', example: 'Satu Juta Rupiah', category: 'Payroll, Pajak & BPJS' },
  bulan_mulai_potong: { label: 'Bulan Awal Pemotongan Gaji', example: 'November 2026', category: 'Payroll, Pajak & BPJS' },
  bulan_selesai_potong: { label: 'Bulan Akhir Pelunasan Pinjaman', example: 'Oktober 2027', category: 'Payroll, Pajak & BPJS' },

  // 6. Klaim Biaya & Reimbursement
  total_klaim: { label: 'Total Nilai Pengajuan Klaim', example: 'Rp 2.850.000', category: 'Payroll, Pajak & BPJS' },
  total_klaim_terbilang: { label: 'Total Nilai Klaim Terbilang', example: 'Dua Juta Delapan Ratus Lima Puluh Ribu Rupiah', category: 'Payroll, Pajak & BPJS' },
  kategori_alasan: { label: 'Kategori Reimbursement', example: 'Klaim Biaya Perjalanan Dinas Operasional', category: 'Payroll, Pajak & BPJS' },
  jumlah_bersih_bayar: { label: 'Jumlah Bersih yang Disetujui', example: 'Rp 2.850.000', category: 'Payroll, Pajak & BPJS' },
  jumlah_bersih_terbilang: { label: 'Jumlah Bersih Disetujui Terbilang', example: 'Dua Juta Delapan Ratus Lima Puluh Ribu Rupiah', category: 'Payroll, Pajak & BPJS' },
  biaya_bbm_tol: { label: 'Biaya Bahan Bakar & Tol', example: 'Rp 450.000', category: 'Payroll, Pajak & BPJS' },
  biaya_hotel: { label: 'Biaya Akomodasi Hotel', example: 'Rp 1.200.000', category: 'Payroll, Pajak & BPJS' },
  biaya_tiket: { label: 'Biaya Tiket Pesawat / Kereta', example: 'Rp 850.000', category: 'Payroll, Pajak & BPJS' },
  biaya_perdiem: { label: 'Uang Saku Harian (Perdiem)', example: 'Rp 350.000', category: 'Payroll, Pajak & BPJS' },
  biaya_entertainment: { label: 'Biaya Jamuan Klien / Entertainment', example: 'Rp 500.000', category: 'Payroll, Pajak & BPJS' },
  biaya_perlengkapan: { label: 'Biaya Perlengkapan Penunjang', example: 'Rp 250.000', category: 'Payroll, Pajak & BPJS' },
  biaya_kesehatan: { label: 'Biaya Pengobatan Rawat Jalan', example: 'Rp 600.000', category: 'Payroll, Pajak & BPJS' },
  biaya_lainnya: { label: 'Biaya Operasional Lain-lain', example: 'Rp 150.000', category: 'Payroll, Pajak & BPJS' },

  // 7. Presensi, Lembur & Cuti
  periode_cut_off: { label: 'Periode Cut-Off Presensi', example: '21 September 2026 s/d 20 Oktober 2026', category: 'Kehadiran, Cuti & Dinas' },
  total_hari_kerja: { label: 'Jumlah Hari Kerja Efektif', example: '22 Hari Kerja', category: 'Kehadiran, Cuti & Dinas' },
  total_hadir: { label: 'Total Hari Hadir Kerja', example: '21 Hari', category: 'Kehadiran, Cuti & Dinas' },
  total_terlambat: { label: 'Frekuensi Keterlambatan Hadir', example: '1 Kali', category: 'Kehadiran, Cuti & Dinas' },
  total_menit_terlambat: { label: 'Total Durasi Keterlambatan (Menit)', example: '15 Menit', category: 'Kehadiran, Cuti & Dinas' },
  total_pulang_cepat: { label: 'Frekuensi Pulang Cepat', example: '0 Kali', category: 'Kehadiran, Cuti & Dinas' },
  total_alpa: { label: 'Jumlah Mangkir / Tanpa Keterangan', example: '0 Hari', category: 'Kehadiran, Cuti & Dinas' },
  total_izin: { label: 'Jumlah Izin Resmi', example: '0 Hari', category: 'Kehadiran, Cuti & Dinas' },
  total_sakit: { label: 'Jumlah Hari Sakit dengan Surat Dokter', example: '1 Hari', category: 'Kehadiran, Cuti & Dinas' },
  total_cuti: { label: 'Jumlah Cuti yang Diambil', example: '0 Hari', category: 'Kehadiran, Cuti & Dinas' },
  total_jam_lembur: { label: 'Akumulasi Jam Lembur', example: '6.5 Jam', category: 'Kehadiran, Cuti & Dinas' },
  lembur_hari_kerja: { label: 'Jam Lembur pada Hari Kerja', example: '4.5 Jam', category: 'Kehadiran, Cuti & Dinas' },
  lembur_hari_libur: { label: 'Jam Lembur pada Hari Libur', example: '2.0 Jam', category: 'Kehadiran, Cuti & Dinas' },
  sisa_cuti: { label: 'Sisa Hak Cuti Tahunan Karyawan', example: '11 Hari', category: 'Kehadiran, Cuti & Dinas' },
  durasi_hari: { label: 'Durasi Izin / Cuti (Hari)', example: '2 Hari Kerja', category: 'Kehadiran, Cuti & Dinas' },
  keterangan_cuti: { label: 'Alasan Permohonan Cuti / Izin', example: 'Keperluan keluarga di luar kota', category: 'Kehadiran, Cuti & Dinas' },
  jam_masuk_lama: { label: 'Jam Masuk Tercatat Sebelumnya', example: '09:15 WIB (Terlambat)', category: 'Kehadiran, Cuti & Dinas' },
  jam_masuk_baru: { label: 'Koreksi Jam Masuk Seharusnya', example: '08:30 WIB', category: 'Kehadiran, Cuti & Dinas' },
  jam_pulang_lama: { label: 'Jam Pulang Tercatat Sebelumnya', example: '17:30 WIB', category: 'Kehadiran, Cuti & Dinas' },
  jam_pulang_baru: { label: 'Koreksi Jam Pulang Seharusnya', example: '17:30 WIB', category: 'Kehadiran, Cuti & Dinas' },
  jam_mulai: { label: 'Jam Mulai Pelaksanaan', example: '08:30 WIB', category: 'Kehadiran, Cuti & Dinas' },
  jam_selesai: { label: 'Jam Selesai Pelaksanaan', example: '17:30 WIB', category: 'Kehadiran, Cuti & Dinas' },
  penjelasan_koreksi: { label: 'Penjelasan Kendala Koreksi Presensi', example: 'Mesin fingerprint offline pada gate timur', category: 'Kehadiran, Cuti & Dinas' },

  // 8. Perjalanan Dinas & Kendaraan Operasional
  kota_tujuan: { label: 'Kota / Destinasi Perjalanan Dinas', example: 'Surabaya & Malang, Jawa Timur', category: 'Kehadiran, Cuti & Dinas' },
  keperluan_dinas: { label: 'Maksud & Tujuan Perjalanan Dinas', example: 'Audit Implementasi Sistem & Rapat Koordinasi Cabang', category: 'Kehadiran, Cuti & Dinas' },
  tanggal_berangkat: { label: 'Tanggal Keberangkatan', example: '02 November 2026', category: 'Kehadiran, Cuti & Dinas' },
  tanggal_kembali: { label: 'Tanggal Kembali ke Kantor', example: '05 November 2026', category: 'Kehadiran, Cuti & Dinas' },
  total_estimasi_biaya: { label: 'Estimasi Total Biaya Dinas', example: 'Rp 4.500.000', category: 'Kehadiran, Cuti & Dinas' },
  jam_berangkat: { label: 'Jam Keberangkatan Kendaraan', example: '07:30 WIB', category: 'Kehadiran, Cuti & Dinas' },
  jam_kembali: { label: 'Jam Kembali Kendaraan', example: '18:00 WIB', category: 'Kehadiran, Cuti & Dinas' },
  model_kendaraan: { label: 'Tipe / Model Mobil Operasional', example: 'Toyota Innova Zenix 2.0 V', category: 'Kehadiran, Cuti & Dinas' },
  nomor_polisi: { label: 'Nomor Polisi Kendaraan Dinas', example: 'B 1234 NTM', category: 'Kehadiran, Cuti & Dinas' },
  nama_driver: { label: 'Nama Pengemudi / Driver', example: 'Bambang Suherman (Driver Kantor)', category: 'Kehadiran, Cuti & Dinas' },
  nomor_sim: { label: 'Nomor SIM Pengemudi', example: '9401-1234-5678 (SIM A Aktif)', category: 'Kehadiran, Cuti & Dinas' },
  warna_kendaraan: { label: 'Warna Unit Kendaraan', example: 'Hitam Metalik', category: 'Kehadiran, Cuti & Dinas' },
  km_awal: { label: 'Odometer KM Awal Kendaraan', example: '24.510 KM', category: 'Kehadiran, Cuti & Dinas' },
  km_akhir: { label: 'Odometer KM Pengembalian', example: '24.680 KM', category: 'Kehadiran, Cuti & Dinas' },
  saldo_etoll: { label: 'Saldo Awal Kartu E-Toll', example: 'Rp 250.000', category: 'Kehadiran, Cuti & Dinas' },
  tujuan_penugasan: { label: 'Tujuan Penugasan Resmi', example: 'Kunjungan Lapangan & Uji Coba Lapangan', category: 'Kehadiran, Cuti & Dinas' },

  // 9. Kinerja, KPI & OKR
  periode_penilaian: { label: 'Periode Evaluasi Kinerja Karyawan', example: 'Kuartal 3 Tahun 2026 (Q3 2026)', category: 'Karier & Organisasi' },
  predikat_kinerja: { label: 'Predikat Akhir Kinerja', example: 'Sangat Baik (Exceeds Expectations)', category: 'Karier & Organisasi' },
  nilai_akhir_okr: { label: 'Skor Rata-Rata Capaian OKR', example: '94.5 / 100', category: 'Karier & Organisasi' },
  kr_1_nama: { label: 'Key Result 1 (KR 1)', example: 'Uptime Sistem Cloud Architecture >= 99.95%', category: 'Karier & Organisasi' },
  kr_1_skor: { label: 'Capaian Skor KR 1', example: '98% (Tercapai)', category: 'Karier & Organisasi' },
  kr_2_nama: { label: 'Key Result 2 (KR 2)', example: 'Otomasi Pipeline Deployment CI/CD', category: 'Karier & Organisasi' },
  kr_2_skor: { label: 'Capaian Skor KR 2', example: '95% (Tercapai)', category: 'Karier & Organisasi' },
  kr_3_nama: { label: 'Key Result 3 (KR 3)', example: 'Mentoring & Knowledge Transfer 3 Junior Dev', category: 'Karier & Organisasi' },
  kr_3_skor: { label: 'Capaian Skor KR 3', example: '90% (Tercapai)', category: 'Karier & Organisasi' },
  nilai_integritas: { label: 'Nilai Budaya Perusahaan: Integritas', example: '95 (Sangat Baik)', category: 'Karier & Organisasi' },
  nilai_kolaborasi: { label: 'Nilai Budaya Perusahaan: Kolaborasi', example: '92 (Sangat Baik)', category: 'Karier & Organisasi' },
  nama_atasan_penilai: { label: 'Nama Atasan Penilai Kinerja', example: 'Ir. Doni Prasetyo, M.T. (VP Technology)', category: 'Karier & Organisasi' },

  // 10. Disiplin & Pelanggaran
  tingkat_sanksi: { label: 'Tingkat Sanksi Disiplin', example: 'Surat Peringatan Pertama (SP 1)', category: 'Disiplin, PHK & Paklaring' },
  tanggal_kejadian: { label: 'Tanggal Terjadinya Pelanggaran', example: '15 Oktober 2026', category: 'Disiplin, PHK & Paklaring' },
  uraian_pelanggaran: { label: 'Uraian Fakta Pelanggaran Disiplin', example: 'Mangkir kerja selama 3 hari berturut-turut tanpa pemberitahuan resmi', category: 'Disiplin, PHK & Paklaring' },
  pasal_pelanggaran: { label: 'Pasal Peraturan Perusahaan yang Dilanggar', example: 'Pasal 24 Ayat 3 Tata Tertib Kehadiran Pegawai', category: 'Disiplin, PHK & Paklaring' },
  tanggal_pemeriksaan: { label: 'Tanggal Berita Acara Klarifikasi (BAP)', example: '20 Oktober 2026', category: 'Disiplin, PHK & Paklaring' },
  nama_saksi: { label: 'Nama Saksi Pemeriksaan Disiplin', example: 'Herlina Kusuma, S.Psi (HR Officer)', category: 'Disiplin, PHK & Paklaring' },
  nik_saksi: { label: 'NIK Saksi Pemeriksaan', example: 'NTM-2024-032', category: 'Disiplin, PHK & Paklaring' },

  // 11. Magang Industri
  institusi: { label: 'Asal Universitas / Politeknik / SMK', example: 'Institut Teknologi Bandung (ITB)', category: 'Magang Industri' },
  jurusan: { label: 'Program Studi / Jurusan Peserta', example: 'Teknik Informatika', category: 'Magang Industri' },
  durasi_hari_kerja: { label: 'Total Hari Kerja Magang Diselesaikan', example: '60 Hari Kerja (3 Bulan Penuh)', category: 'Magang Industri' },

  // 12. Pengadaan, Vendor & PO
  nama_vendor: { label: 'Nama Perusahaan / Rekanan Vendor', example: 'PT Mitra Solusi Pratama', category: 'Pengadaan, Aset & GA' },
  pic_vendor: { label: 'Person in Charge (PIC) Vendor', example: 'Dian Anggraini (Account Manager)', category: 'Pengadaan, Aset & GA' },
  telepon_vendor: { label: 'Nomor Telepon Vendor', example: '+62 21 8899 0011', category: 'Pengadaan, Aset & GA' },
  alamat_vendor: { label: 'Alamat Kantor Vendor', example: 'Jl. TB Simatupang No. 45, Jakarta Selatan', category: 'Pengadaan, Aset & GA' },
  npwp_vendor: { label: 'NPWP Vendor', example: '01.234.567.8-015.000', category: 'Pengadaan, Aset & GA' },
  rekening_vendor: { label: 'Nomor Rekening Bank Vendor', example: 'Bank Mandiri 127-00-1122334-5 a.n PT Mitra Solusi', category: 'Pengadaan, Aset & GA' },
  nama_bank_vendor: { label: 'Nama Bank Vendor', example: 'Bank Mandiri Cabang Sudirman', category: 'Pengadaan, Aset & GA' },
  nama_direktur_vendor: { label: 'Nama Direktur / Pimpinan Vendor', example: 'Ir. Hendri Gunawan (Direktur Utama)', category: 'Pengadaan, Aset & GA' },
  nomor_po: { label: 'Nomor Purchase Order (PO)', example: 'PO/NTM-GA/2026/X/0042', category: 'Pengadaan, Aset & GA' },
  grand_total_po: { label: 'Grand Total Purchase Order (Inc PPN)', example: 'Rp 33.300.000', category: 'Pengadaan, Aset & GA' },
  grand_total_terbilang: { label: 'Grand Total PO Terbilang', example: 'Tiga Puluh Tiga Juta Tiga Ratus Ribu Rupiah', category: 'Pengadaan, Aset & GA' },
  nomor_invoice: { label: 'Nomor Tagihan / Invoice Vendor', example: 'INV/MSP/2026/10/019', category: 'Pengadaan, Aset & GA' },
  total_sebelum_pajak: { label: 'Total Tagihan Sebelum Pajak (DPP)', example: 'Rp 30.000.000', category: 'Pengadaan, Aset & GA' },
  nilai_ppn: { label: 'Nilai PPN 11%', example: 'Rp 3.300.000', category: 'Pengadaan, Aset & GA' },
  potongan_pph23: { label: 'Potongan Pajak PPh Pasal 23 (2%)', example: 'Rp 600.000', category: 'Pengadaan, Aset & GA' },
  nomor_bast: { label: 'Nomor Berita Acara Serah Terima (BAST)', example: 'BAST/NTM-IT/2026/10/003', category: 'Pengadaan, Aset & GA' },
  kategori_pengadaan: { label: 'Kategori Pengadaan Barang / Jasa', example: 'Perangkat Keras & Infrastruktur IT', category: 'Pengadaan, Aset & GA' },
  nilai_kontrak: { label: 'Nilai Kontrak Pengadaan', example: 'Rp 150.000.000', category: 'Pengadaan, Aset & GA' },
  nilai_terbilang: { label: 'Nilai Kontrak Terbilang', example: 'Seratus Lima Puluh Juta Rupiah', category: 'Pengadaan, Aset & GA' },
  item_1_nama: { label: 'Nama Barang / Item Pembelian 1', example: 'Laptop Dell Latitude 5440 Core i7', category: 'Pengadaan, Aset & GA' },
  item_1_qty: { label: 'Kuantitas / Jumlah Item 1', example: '2 Unit', category: 'Pengadaan, Aset & GA' },
  item_1_harga: { label: 'Harga Satuan Item 1', example: 'Rp 18.500.000', category: 'Pengadaan, Aset & GA' },
  item_1_subtotal: { label: 'Subtotal Item 1', example: 'Rp 37.000.000', category: 'Pengadaan, Aset & GA' },
  item_2_nama: { label: 'Nama Barang / Item Pembelian 2', example: 'Monitor Dell 24 Inch IPS FHD', category: 'Pengadaan, Aset & GA' },
  item_2_qty: { label: 'Kuantitas / Jumlah Item 2', example: '2 Unit', category: 'Pengadaan, Aset & GA' },
  item_2_harga: { label: 'Harga Satuan Item 2', example: 'Rp 2.250.000', category: 'Pengadaan, Aset & GA' },
  item_2_subtotal: { label: 'Subtotal Item 2', example: 'Rp 4.500.000', category: 'Pengadaan, Aset & GA' },
  tanggal_pengiriman_maksimal: { label: 'Batas Akhir Waktu Pengiriman Barang', example: '10 November 2026', category: 'Pengadaan, Aset & GA' },
  total_penawaran: { label: 'Total Nilai Penawaran / Quotation', example: 'Rp 41.500.000', category: 'Pengadaan, Aset & GA' },
  harga_lisensi: { label: 'Biaya Lisensi Perangkat Lunak', example: 'Rp 60.000.000', category: 'Pengadaan, Aset & GA' },
  harga_implementasi: { label: 'Biaya Jasa Implementasi & Setup', example: 'Rp 40.000.000', category: 'Pengadaan, Aset & GA' },
  harga_training: { label: 'Biaya Pelatihan Pengguna (Training)', example: 'Rp 15.000.000', category: 'Pengadaan, Aset & GA' },
  harga_sla: { label: 'Biaya Garansi & SLA Pemeliharaan', example: 'Rp 10.000.000', category: 'Pengadaan, Aset & GA' },
  tanggal_selesai: { label: 'Target Tanggal Penyelesaian Proyek', example: '31 Januari 2027', category: 'Pengadaan, Aset & GA' },

  // 13. Aset, Fasilitas & GA
  model_laptop: { label: 'Tipe / Spesifikasi Model Laptop', example: 'MacBook Pro 14 M3 Pro / Dell Latitude 5440', category: 'Pengadaan, Aset & GA' },
  processor_spec: { label: 'Spesifikasi Processor / CPU', example: 'Apple M3 Pro (12-Core CPU, 18-Core GPU)', category: 'Pengadaan, Aset & GA' },
  ram_spec: { label: 'Kapasitas RAM Memori', example: '32 GB LPDDR5 Unified Memory', category: 'Pengadaan, Aset & GA' },
  storage_spec: { label: 'Kapasitas Ruang Penyimpanan SSD', example: '1 TB NVMe PCIe Gen 4 SSD', category: 'Pengadaan, Aset & GA' },
  estimasi_harga: { label: 'Estimasi Anggaran Pembelian', example: 'Rp 32.500.000', category: 'Pengadaan, Aset & GA' },
  justifikasi_kebutuhan: { label: 'Alasan Bisnis & Justifikasi Kebutuhan', example: 'Peremajaan perangkat laptop lama untuk optimasi kompilasi kode sistem cloud', category: 'Pengadaan, Aset & GA' },
  alasan_kebutuhan: { label: 'Uraian Singkat Latar Belakang Kebutuhan', example: 'Kebutuhan inventaris kerja karyawan baru departemen IT', category: 'Pengadaan, Aset & GA' },
  kuartal_anggaran: { label: 'Kuartal Anggaran Belanja (Capex/Opex)', example: 'Q4 Tahun Anggaran 2026', category: 'Pengadaan, Aset & GA' },
  nama_teknisi_it: { label: 'Nama Teknisi IT Helpdesk', example: 'Fikri Ramadhan (Senior IT Support)', category: 'Pengadaan, Aset & GA' },
  kategori_layanan: { label: 'Kategori Tiket Layanan Helpdesk', example: 'Penggantian Hardware & Reset Akun', category: 'Pengadaan, Aset & GA' },
  deskripsi_tiket: { label: 'Rincian Masalah / Permintaan Tiket', example: 'Layar monitor bergaris dan baterai laptop mengalami degradasi drastis', category: 'Pengadaan, Aset & GA' },
  tingkat_urgensi: { label: 'Tingkat Urgensi Tiket', example: 'Tinggi (Prioritas Pengerjaan 2x24 Jam)', category: 'Pengadaan, Aset & GA' },
  waktu_estimasi: { label: 'Estimasi Waktu Penyelesaian Layanan', example: '2 Hari Kerja', category: 'Pengadaan, Aset & GA' },
  nama_ruang_rapat: { label: 'Nama Ruang Pertemuan / Rapat', example: 'Ruang Rapat Nusantara (Lt. 18)', category: 'Pengadaan, Aset & GA' },
  tanggal_rapat: { label: 'Tanggal Penggunaan Ruang Rapat', example: '28 Oktober 2026', category: 'Pengadaan, Aset & GA' },
  waktu_mulai: { label: 'Waktu Mulai Acara / Rapat', example: '09:30 WIB', category: 'Pengadaan, Aset & GA' },
  waktu_selesai: { label: 'Waktu Selesai Acara / Rapat', example: '12:00 WIB', category: 'Pengadaan, Aset & GA' },
  jumlah_hari: { label: 'Jumlah Hari Reservasi', example: '1 Hari', category: 'Pengadaan, Aset & GA' },
  agenda_rapat: { label: 'Topik Pembahasan / Agenda Pertemuan', example: 'Townhall Meeting & Evaluasi Akhir Kuartal Perusahaan', category: 'Pengadaan, Aset & GA' },
  kapasitas_orang: { label: 'Jumlah Peserta Rapat / Tamu', example: '25 Orang', category: 'Pengadaan, Aset & GA' },
  jumlah_kertas: { label: 'Permintaan Kertas HVS (Rim)', example: '5 Rim (A4 80gr)', category: 'Pengadaan, Aset & GA' },
  jumlah_pena: { label: 'Permintaan Ballpoint / Pena (Lusin)', example: '2 Lusin (Pilot Ballpoint Hitam)', category: 'Pengadaan, Aset & GA' },
  jumlah_notes: { label: 'Permintaan Sticky Notes / Memo', example: '10 Pad (Post-It 3x3)', category: 'Pengadaan, Aset & GA' },
  jumlah_binder: { label: 'Permintaan Ordner / Binder Map', example: '8 Pcs (Bantex Folio Biru)', category: 'Pengadaan, Aset & GA' },
  kebutuhan_lainnya: { label: 'Kebutuhan ATK / Logistik Tambahan', example: 'Spidol whiteboard 4 warna & penghapus', category: 'Pengadaan, Aset & GA' },
  instansi_klien: { label: 'Nama Instansi / Perusahaan Klien', example: 'Kementerian BUMN Republik Indonesia', category: 'Pengadaan, Aset & GA' },
  nama_klien: { label: 'Nama Klien / Pejabat Mitra', example: 'Drs. Hendro Wibowo, M.Si', category: 'Pengadaan, Aset & GA' },
  nama_klien_lokasi: { label: 'Lokasi Kantor Instansi Klien', example: 'Gedung Utama Kementerian BUMN, Jl. Medan Merdeka Selatan, Jakarta', category: 'Pengadaan, Aset & GA' },
  alamat_klien: { label: 'Alamat Lengkap Kantor Klien', example: 'Jl. Medan Merdeka Selatan No. 13, Jakarta Pusat', category: 'Pengadaan, Aset & GA' },
  nama_proyek: { label: 'Nama Inisiatif / Proyek Kerja', example: 'Modernisasi HRMS Digital Terpadu 2026', category: 'Pengadaan, Aset & GA' },
  jenis_permohonan: { label: 'Jenis Formulir Permohonan', example: 'Pengadaan Hardware Komputer Baru', category: 'Pengadaan, Aset & GA' },

  // 14. Dokumen & Legalitas Tenant
  nomor_surat: { label: 'Nomor Surat Keputusan Resmi', example: '042/HRD-PKWT/NTM/X/2026', category: 'Perusahaan & Naskah Dinas' },
  nama_perusahaan: { label: 'Nama Perusahaan / Tenant', example: 'PT Nusantara Teknologi Mandiri', category: 'Perusahaan & Naskah Dinas' },
  alamat_perusahaan: { label: 'Alamat Kantor Perusahaan', example: 'Menara Palma Lt. 18, Jakarta Selatan', category: 'Perusahaan & Naskah Dinas' },
  telepon_perusahaan: { label: 'Telepon Resmi Perusahaan', example: '+62 21 5566 7788', category: 'Perusahaan & Naskah Dinas' },
  email_perusahaan: { label: 'Email Resmi Legal Perusahaan', example: 'legal.hr@nusantara.id', category: 'Perusahaan & Naskah Dinas' },
  npwp_perusahaan_16: { label: 'NPWP Badan Usaha Perusahaan (16 Digit)', example: '0199988870110000', category: 'Perusahaan & Naskah Dinas' },
  penandatangan: { label: 'Nama Pejabat Penanda Tangan', example: 'Aditya Pratama, S.Psi', category: 'Perusahaan & Naskah Dinas' },
  jabatan_penandatangan: { label: 'Jabatan Pejabat Penanda Tangan', example: 'VP of Human Capital', category: 'Perusahaan & Naskah Dinas' },
  tanggal_terbit: { label: 'Tanggal Surat Diterbitkan', example: '22 Oktober 2026', category: 'Perusahaan & Naskah Dinas' },
  qr_code: { label: 'Stempel Tanda Tangan QR Digital UU ITE', example: '[QR Code Verifikasi]', category: 'Perusahaan & Naskah Dinas' },
};

/**
 * Format bytes into human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Parses a .docx File object in the browser using mammoth
 */
export const parseDocxFile = async (file: File): Promise<ParsedDocxResult> => {
  const arrayBuffer = await file.arrayBuffer();

  // Convert to HTML
  const htmlResult = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1.text-lg.font-bold.text-slate-900.mb-2",
        "p[style-name='Heading 2'] => h2.text-base.font-bold.text-slate-800.mb-1.5",
        "p[style-name='Heading 3'] => h3.text-sm.font-semibold.text-slate-800.mb-1",
      ],
    }
  );

  // Extract raw text for clean processing and variable analysis
  const textResult = await mammoth.extractRawText({ arrayBuffer });

  const rawHtml = htmlResult.value || '';
  const rawText = textResult.value || '';

  // Extract all placeholders matching {{variable}} or {VARIABLE}
  const placeholderSet = new Set<string>();

  // Match {{var_name}}
  const doubleBraceRegex = /\{\{([a-zA-Z0-9_\-\s]+)\}\}/g;
  let match;
  while ((match = doubleBraceRegex.exec(rawText)) !== null) {
    placeholderSet.add(match[1].trim().toLowerCase());
  }

  // Match {VARIABLE}
  const singleBraceRegex = /\{([A-Z0-9_]+)\}/g;
  while ((match = singleBraceRegex.exec(rawText)) !== null) {
    placeholderSet.add(match[1].trim().toLowerCase());
  }

  return {
    html: rawHtml,
    rawText,
    placeholders: Array.from(placeholderSet),
    fileName: file.name,
    fileSize: formatFileSize(file.size),
  };
};

/**
 * Helper to convert number to Indonesian words (terbilang)
 */
export const angkaKeTerbilang = (angka: number): string => {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  if (angka < 12) return bilangan[angka];
  if (angka < 20) return `${angkaKeTerbilang(angka - 10)} Belas`;
  if (angka < 100) return `${angkaKeTerbilang(Math.floor(angka / 10))} Puluh ${bilangan[angka % 10]}`.trim();
  if (angka < 200) return `Seratus ${angkaKeTerbilang(angka - 100)}`.trim();
  if (angka < 1000) return `${angkaKeTerbilang(Math.floor(angka / 100))} Ratus ${angkaKeTerbilang(angka % 100)}`.trim();
  if (angka < 2000) return `Seribu ${angkaKeTerbilang(angka - 1000)}`.trim();
  if (angka < 1000000) return `${angkaKeTerbilang(Math.floor(angka / 1000))} Ribu ${angkaKeTerbilang(angka % 1000)}`.trim();
  if (angka < 1000000000) return `${angkaKeTerbilang(Math.floor(angka / 1000000))} Juta ${angkaKeTerbilang(angka % 1000000)}`.trim();
  if (angka < 1000000000000) return `${angkaKeTerbilang(Math.floor(angka / 1000000000))} Miliar ${angkaKeTerbilang(angka % 1000000000)}`.trim();
  return `${angka}`;
};

export interface NumberingTokenInfo {
  token: string;
  category: 'Waktu & Kalender' | 'Nomor & Urutan' | 'Organisasi & Entitas' | 'Klasifikasi Dokumen';
  label: string;
  description: string;
  example: string;
}

export const NUMBERING_TOKEN_REGISTRY: NumberingTokenInfo[] = [
  {
    token: '{ROMAN_MONTH}',
    category: 'Waktu & Kalender',
    label: 'Bulan Romawi',
    description: 'Format baku penomoran surat resmi Indonesia (I s/d XII)',
    example: 'X',
  },
  {
    token: '{MONTH}',
    category: 'Waktu & Kalender',
    label: 'Bulan Angka (2 Digit)',
    description: 'Bulan berjalan dengan awalan nol (01 - 12)',
    example: '10',
  },
  {
    token: '{MONTH_NAME}',
    category: 'Waktu & Kalender',
    label: 'Nama Bulan',
    description: 'Nama bulan penuh dalam bahasa Indonesia (Januari - Desember)',
    example: 'Oktober',
  },
  {
    token: '{YEAR}',
    category: 'Waktu & Kalender',
    label: 'Tahun Penuh (4 Digit)',
    description: 'Tahun kalender 4 digit penuh',
    example: '2026',
  },
  {
    token: '{YEAR_2}',
    category: 'Waktu & Kalender',
    label: 'Tahun 2 Digit (YY)',
    description: 'Dua digit akhir dari tahun penerbitan',
    example: '26',
  },
  {
    token: '{DAY}',
    category: 'Waktu & Kalender',
    label: 'Hari / Tanggal (2 Digit)',
    description: 'Tanggal hari penerbitan dengan awalan nol (01 - 31)',
    example: '23',
  },
  {
    token: '{QUARTER}',
    category: 'Waktu & Kalender',
    label: 'Kuartal Kalender',
    description: 'Kuartal tahun berjalan (Q1, Q2, Q3, Q4)',
    example: 'Q4',
  },
  {
    token: '{SEQ}',
    category: 'Nomor & Urutan',
    label: 'Nomor Urut 3 Digit (Sequence)',
    description: 'Nomor urut otomatis 3 digit (001, 002, 042, dst)',
    example: '001',
  },
  {
    token: '{SEQ:4}',
    category: 'Nomor & Urutan',
    label: 'Nomor Urut 4 Digit (Sequence)',
    description: 'Nomor urut otomatis 4 digit (0001, 0042, dst)',
    example: '0001',
  },
  {
    token: '{TENANT_CODE}',
    category: 'Organisasi & Entitas',
    label: 'Kode Singkatan Tenant / Perusahaan',
    description: 'Kode entitas perusahaan dari konfigurasi multi-tenant',
    example: 'NTM',
  },
  {
    token: '{COMPANY_NAME}',
    category: 'Organisasi & Entitas',
    label: 'Nama Perusahaan',
    description: 'Nama lengkap perusahaan / tenant aktif',
    example: 'PT Nusantara Jaya',
  },
  {
    token: '{DEPT_CODE}',
    category: 'Organisasi & Entitas',
    label: 'Kode Departemen / Divisi',
    description: 'Kode divisi penerbit (HRD, HC, GA, FIN, LEGAL)',
    example: 'HRD',
  },
  {
    token: '{DOC_TYPE}',
    category: 'Klasifikasi Dokumen',
    label: 'Kode Singkatan Jenis Dokumen',
    description: 'Singkatan tipe surat resmi (PKWT, PKWTT, SP, SK, BAST)',
    example: 'PKWT',
  },
];

/**
 * Generate Roman Numeral for Month
 */
export const getRomanMonth = (monthIndex: number): string => {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[monthIndex] || 'X';
};

/**
 * Evaluates document numbering formula
 */
export const evaluateNumberingFormula = (
  formula: string,
  seq: number,
  tenantCode: string,
  date: Date = new Date(),
  extraOptions?: {
    deptCode?: string;
    docType?: string;
    companyName?: string;
  }
): string => {
  const year = date.getFullYear().toString();
  const year2 = year.slice(-2);
  const monthIdx = date.getMonth();
  const monthNum = String(monthIdx + 1).padStart(2, '0');
  const dayNum = String(date.getDate()).padStart(2, '0');
  const romanMonth = getRomanMonth(monthIdx);
  const seq3 = String(seq).padStart(3, '0');
  const seq4 = String(seq).padStart(4, '0');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[monthIdx] || 'Januari';
  const quarter = `Q${Math.floor(monthIdx / 3) + 1}`;

  const deptCode = extraOptions?.deptCode || 'HRD';
  const docType = extraOptions?.docType || 'SK';
  const companyName = extraOptions?.companyName || tenantCode;

  return formula
    .replace(/\{SEQ:4\}/g, seq4)
    .replace(/\{SEQ\}/g, seq3)
    .replace(/\{TENANT_CODE\}/g, tenantCode)
    .replace(/\{TENANT\}/g, tenantCode)
    .replace(/\{ROMAN_MONTH\}/g, romanMonth)
    .replace(/\{MONTH_NAME\}/g, monthName)
    .replace(/\{MONTH\}/g, monthNum)
    .replace(/\{YEAR_2\}/g, year2)
    .replace(/\{YY\}/g, year2)
    .replace(/\{YEAR\}/g, year)
    .replace(/\{DAY\}/g, dayNum)
    .replace(/\{QUARTER\}/g, quarter)
    .replace(/\{DEPT_CODE\}/g, deptCode)
    .replace(/\{DEPT\}/g, deptCode)
    .replace(/\{DOC_TYPE\}/g, docType)
    .replace(/\{TYPE\}/g, docType)
    .replace(/\{COMPANY_NAME\}/g, companyName);
};

/**
 * Replaces all placeholders in template content with real employee & company data
 */
export const interpolateDocxTemplate = (
  content: string,
  context: {
    employee?: Employee | null;
    tenant?: Tenant | null;
    documentNumber?: string;
    signeeName?: string;
    signeeRole?: string;
    issueDate?: string;
  }
): string => {
  const emp = context.employee || ({} as Partial<Employee>);
  const ten = context.tenant || ({} as Partial<Tenant>);
  const documentNumber = context.documentNumber || '';
  const signeeName = context.signeeName || 'Pejabat Berwenang';
  const signeeRole = context.signeeRole || 'Direksi / Manajemen';

  const dateObj = context.issueDate ? new Date(context.issueDate) : new Date();
  const dateFormatted = dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const salaryNum = emp.basicSalary || 0;
  const salaryRupiah = formatRupiah(salaryNum);
  const salaryWords = `${angkaKeTerbilang(salaryNum)} Rupiah`;

  const map: Record<string, string> = {
    // Employee
    nama: emp.fullName || '-',
    nama_karyawan: emp.fullName || '-',
    karyawan: emp.fullName || '-',
    nik: emp.nik || '-',
    nik_karyawan: emp.nik || '-',
    nik_ktp: emp.nikKtp || '-',
    ktp: emp.nikKtp || '-',
    no_kk: emp.noKk || '-',
    jabatan: emp.position || '-',
    posisi: emp.position || '-',
    departemen: emp.department || '-',
    divisi: emp.department || '-',
    grade: emp.grade || 'L3',
    gaji_pokok: salaryRupiah,
    gaji: salaryRupiah,
    gaji_terbilang: salaryWords,
    status_kerja: emp.employmentType || 'PKWT',
    tipe_kontrak: emp.employmentType || 'PKWT',
    tanggal_mulai: emp.contractStartDate || emp.joinDate || dateFormatted,
    tgl_mulai: emp.contractStartDate || emp.joinDate || dateFormatted,
    tanggal_berakhir: emp.contractEndDate || 'Sampai Penetapan Selanjutnya',
    tgl_berakhir: emp.contractEndDate || 'Sampai Penetapan Selanjutnya',
    alamat_karyawan: emp.ktpAddress || emp.currentAddress || 'DKI Jakarta',
    ptkp: emp.ptkp ? `${emp.ptkp} (${getTERCategory(emp.ptkp)})` : 'TK/0',
    npwp: emp.npwp || '00.000.000.0-000.000',
    rekening: emp.bankName ? `${emp.bankName} - ${emp.bankAccount}` : '-',

    // Company & Document
    nomor_surat: documentNumber,
    nomor_dokumen: documentNumber,
    nama_perusahaan: ten.name || 'PT Nusantara Teknologi Mandiri',
    perusahaan: ten.name || 'PT Nusantara Teknologi Mandiri',
    alamat_perusahaan: ten.address || 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan',
    telepon_perusahaan: '+62 21 5566 7788',
    email_perusahaan: 'legal.hr@nusantara.id',
    npwp_perusahaan: ten.npwp || '01.999.888.7-011.000',

    // Signee
    penandatangan: signeeName,
    nama_pejabat: signeeName,
    pejabat: signeeName,
    jabatan_penandatangan: signeeRole,
    peran_penandatangan: signeeRole,

    // Date
    tanggal_terbit: dateFormatted,
    tanggal: dateFormatted,
  };

  // Fallback to sample values for all other known variables so preview always looks filled and realistic
  for (const [k, meta] of Object.entries(KNOWN_VARIABLE_DESCRIPTIONS)) {
    if (!map[k]) {
      map[k] = meta.example;
    }
  }

  let interpolated = content;

  // Replace {{var}} (case insensitive)
  for (const [key, val] of Object.entries(map)) {
    const doubleRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    interpolated = interpolated.replace(doubleRegex, val);

    const singleRegex = new RegExp(`\\{\\s*${key.toUpperCase()}\\s*\\}`, 'g');
    interpolated = interpolated.replace(singleRegex, val);
  }

  return interpolated;
};

export interface DocumentSignatoryPreset {
  preferredName: string;
  preferredRole: string;
  matchedEmployeeId?: string;
  documentRoleLabel: string;
  description: string;
}

/**
 * Returns the recommended legal signatory for a specific document type
 */
export const getPresetSignatoryForDocType = (docType: string, employees: Employee[]): DocumentSignatoryPreset => {
  const norm = (docType || '').toLowerCase();

  // 1. SK Promosi Jabatan & Kenaikan Grade / PHK / Pemberhentian
  if (norm.includes('promosi') || norm.includes('phk') || norm.includes('pemberhentian')) {
    const ceo = employees.find(
      (e) =>
        e.position.toLowerCase().includes('director') ||
        e.position.toLowerCase().includes('ceo') ||
        e.fullName.includes('Budi Santoso')
    ) || employees[0];
    return {
      preferredName: ceo ? ceo.fullName : 'Ir. Budi Santoso, MBA',
      preferredRole: 'President Director & CEO',
      matchedEmployeeId: ceo?.id,
      documentRoleLabel: 'Direksi Perusahaan',
      description: 'SK Promosi Jabatan & PHK berkonsekuensi hukum perdata/korporasi wajib disahkan oleh Direktur Utama (CEO).',
    };
  }

  // 2. Surat Penugasan Sementara (Plt) / Pelaksana Tugas / Acting Role
  if (norm.includes('penugasan') || norm.includes('plt') || norm.includes('acting')) {
    const dir = employees.find(
      (e) =>
        e.position.toLowerCase().includes('direktur') ||
        e.fullName.includes('Hendra') ||
        e.department.toLowerCase().includes('human')
    ) || employees[0];
    return {
      preferredName: dir ? dir.fullName : 'Dr. Hendra Wijaya',
      preferredRole: 'Direktur Sumber Daya Manusia',
      matchedEmployeeId: dir?.id,
      documentRoleLabel: 'Pemberi Mandat & Kuasa Tugas',
      description: 'Penugasan Sementara (Plt) membutuhkan mandat resmi dari Direktur Terkait.',
    };
  }

  // 3. Surat Mutasi / Rotasi Kerja Antar Unit
  if (norm.includes('mutasi') || norm.includes('transfer') || norm.includes('rotasi')) {
    const vp = employees.find(
      (e) =>
        e.position.toLowerCase().includes('vp') ||
        e.fullName.includes('Aditya Pratama')
    ) || employees[0];
    return {
      preferredName: vp ? vp.fullName : 'Aditya Pratama, S.Psi',
      preferredRole: 'VP of Human Capital',
      matchedEmployeeId: vp?.id,
      documentRoleLabel: 'Pejabat Penetap Mutasi',
      description: 'Mutasi antar cabang/divisi disahkan oleh Kepala Divisi / VP Human Capital.',
    };
  }

  // 4. Surat Demosi & Sanksi Disiplin / Surat Peringatan (SP I, II, III)
  if (norm.includes('demosi') || norm.includes('peringatan') || norm.includes('sp ') || norm === 'sp' || norm.includes('sanksi')) {
    const ir = employees.find(
      (e) =>
        e.position.toLowerCase().includes('compliance') ||
        e.position.toLowerCase().includes('industrial') ||
        e.fullName.includes('Aditya')
    ) || employees[0];
    return {
      preferredName: ir ? ir.fullName : 'Aditya Pratama, S.Psi',
      preferredRole: 'VP of Human Capital & Compliance',
      matchedEmployeeId: ir?.id,
      documentRoleLabel: 'Pejabat Penegak Disiplin & Hubungan Industrial',
      description: 'Surat Peringatan & Demosi ditandatangani oleh pejabat penegak disiplin & hubungan industrial.',
    };
  }

  // 5. Surat Perjalanan Dinas / Surat Tugas (SPPD)
  if (norm.includes('tugas') || norm.includes('perjalanan') || norm.includes('sppd')) {
    const head = employees.find(
      (e) =>
        e.position.toLowerCase().includes('lead') ||
        e.position.toLowerCase().includes('head') ||
        e.fullName.includes('Siti Aminah')
    ) || employees[0];
    return {
      preferredName: head ? head.fullName : 'Siti Aminah, S.E.',
      preferredRole: 'Head of Division / Finance Director',
      matchedEmployeeId: head?.id,
      documentRoleLabel: 'Pejabat Pemberi Mandat Perjalanan Dinas',
      description: 'Surat Tugas dinas disahkan oleh Kepala Divisi / Finance Director.',
    };
  }

  // 6. Slip Gaji & Remunerasi
  if (norm.includes('gaji') || norm.includes('slip') || norm.includes('payroll')) {
    const payroll = employees.find(
      (e) =>
        e.position.toLowerCase().includes('payroll') ||
        e.position.toLowerCase().includes('finance') ||
        e.department.toLowerCase().includes('finance')
    ) || employees[0];
    return {
      preferredName: payroll ? payroll.fullName : 'Dewi Lestari, S.E.',
      preferredRole: 'Payroll & Remuneration Manager',
      matchedEmployeeId: payroll?.id,
      documentRoleLabel: 'Finance & Remuneration Department',
      description: 'Slip Gaji disahkan oleh Bagian Kompensasi & Payroll.',
    };
  }

  // 7. Surat Keterangan Kerja (Paklaring) / Pengalaman Kerja
  if (norm.includes('keterangan') || norm.includes('paklaring') || norm.includes('skk')) {
    const hr = employees.find(
      (e) =>
        e.position.toLowerCase().includes('people') ||
        e.fullName.includes('Siti Aminah') ||
        e.department.toLowerCase().includes('human')
    ) || employees[0];
    return {
      preferredName: hr ? hr.fullName : 'Siti Aminah, S.E.',
      preferredRole: 'Head of People Operations',
      matchedEmployeeId: hr?.id,
      documentRoleLabel: 'Human Capital Department',
      description: 'Surat Keterangan Kerja diterbitkan oleh People Operations.',
    };
  }

  // 8. BAST Aset & Fasilitas
  if (norm.includes('bast') || norm.includes('aset') || norm.includes('inventaris') || norm.includes('fasilitas')) {
    const ga = employees.find(
      (e) =>
        e.position.toLowerCase().includes('facility') ||
        e.position.toLowerCase().includes('ga') ||
        e.fullName.includes('Bambang Sudiro')
    ) || employees[0];
    return {
      preferredName: ga ? ga.fullName : 'Bambang Sudiro',
      preferredRole: 'General Affairs & Asset Lead',
      matchedEmployeeId: ga?.id,
      documentRoleLabel: 'Bagian Logistik & Sarana',
      description: 'BAST serah terima aset disahkan oleh GA & Asset Lead.',
    };
  }

  // 9. Default: Kontrak Kerja PKWT / PKWTT / Dokumen Personalia Umum
  const defaultHc = employees.find(
    (e) =>
      e.fullName.includes('Aditya Pratama') ||
      e.position.toLowerCase().includes('human capital')
  ) || employees[0];

  return {
    preferredName: defaultHc ? defaultHc.fullName : 'Aditya Pratama, S.Psi',
    preferredRole: 'VP of Human Capital',
    matchedEmployeeId: defaultHc?.id,
    documentRoleLabel: 'Pihak Pertama (Manajemen)',
    description: 'Perjanjian kerja ditandatangani oleh VP of Human Capital atas nama manajemen perusahaan.',
  };
};

/**
 * Pre-packaged Sample Indonesian Legal DOCX Templates that can be loaded instantly
 */
export const SAMPLE_DOCX_PRESETS = [
  {
    id: 'sample-pkwt-pp35',
    title: 'Perjanjian Kerja Waktu Tertentu (PKWT) Standar PP 35/2021',
    fileName: 'Template_PKWT_Standard_PP35_2021.docx',
    fileSize: '32.4 KB',
    type: 'PKWT',
    numberingPattern: '{SEQ}/HRD-PKWT/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    letterHeadNpwp: '01.999.888.7-011.000',
    letterHeadPhone: '+62 21 5566 7788',
    letterHeadEmail: 'legal.hr@nusantara.id',
    kopPosition: 'top' as const,
    qrPosition: 'bottom-right' as const,
    rawText: `PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
Nomor: {{nomor_surat}}

Pada hari ini, tanggal {{tanggal_terbit}}, bertempat di Jakarta, telah dibuat dan ditandatangani Perjanjian Kerja Waktu Tertentu (PKWT) oleh dan antara:

I. PIHAK PERTAMA (PENGUSAHA):
Nama Badan Usaha: {{nama_perusahaan}}
Alamat Kantor: {{alamat_perusahaan}}
NPWP: {{npwp_perusahaan}}
Dalam hal ini diwakili oleh {{penandatangan}}, bertindak dalam kedudukannya selaku {{jabatan_penandatangan}} dari dan oleh karenanya sah mewakili Perusahaan.

II. PIHAK KEDUA (PEKERJA):
Nama Lengkap: {{nama}}
Nomor Induk Kependudukan (KTP): {{nik_ktp}}
Nomor Induk Karyawan (NIK): {{nik}}
Alamat Sesuai KTP: {{alamat_karyawan}}
Status Pajak PTKP: {{ptkp}}

Kedua belah pihak telah sepakat mengikatkan diri dalam Perjanjian Kerja Waktu Tertentu dengan ketentuan sebagai berikut:

PASAL 1: JABATAN & LINGKUP PEKERJAAN
1. Pihak Pertama mempekerjakan Pihak Kedua sebagai {{jabatan}} pada unit/departemen {{departemen}} (Grade: {{grade}}).
2. Pihak Kedua bersedia menjalankan tugas, tanggung jawab, dan mematuhi seluruh Standard Operating Procedure (SOP) yang berlaku di Perusahaan.

PASAL 2: JANGKA WAKTU PERJANJIAN
1. Perjanjian kerja ini berlaku untuk jangka waktu tertentu, dimulai sejak tanggal {{tanggal_mulai}} sampai dengan tanggal {{tanggal_berakhir}}.
2. Perjanjian ini tunduk pada ketentuan Pasal 51-61 Undang-Undang Ketenagakerjaan jo Peraturan Pemerintah No. 35 Tahun 2021.

PASAL 3: UPAH & REMUNERASI
1. Pihak Pertama memberikan imbalan upah pokok kepada Pihak Kedua sebesar {{gaji_pokok}} ({{gaji_terbilang}}) per bulan.
2. Pembayaran upah dilakukan setiap tanggal 25 bulan berjalan melalui transfer ke rekening bank terdaftar ({{rekening}}).
3. Pihak Pertama mengikutsertakan Pihak Kedua dalam program jaminan sosial BPJS Ketenagakerjaan dan BPJS Kesehatan sesuai tarif statutory.

PASAL 4: KOMPENSASI AKHIR KONTRAK
Sesuai Pasal 61A PP 35/2021, Pihak Pertama wajib memberikan uang kompensasi kepada Pihak Kedua saat berakhirnya jangka waktu PKWT yang dihitung secara prorata masa kerja.

PASAL 5: PENGESAHAN DOKUMEN ELEKTRONIK
Perjanjian ini dibuat dan ditandatangani secara elektronik dengan stempel QR Hash Verification terenkripsi yang memiliki kekuatan pembuktian hukum sah menurut UU ITE No. 11/2008.`,
  },
  {
    id: 'sample-sk-tetap',
    title: 'Surat Keputusan Pengangkatan Karyawan Tetap (PKWTT)',
    fileName: 'Template_SK_Pengangkatan_Tetap_PKWTT.docx',
    fileSize: '28.1 KB',
    type: 'PKWTT',
    numberingPattern: '{SEQ}/HRD-SK-TETAP/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    letterHeadNpwp: '01.999.888.7-011.000',
    letterHeadPhone: '+62 21 5566 7788',
    letterHeadEmail: 'legal.hr@nusantara.id',
    kopPosition: 'top' as const,
    qrPosition: 'bottom-right' as const,
    rawText: `SURAT KEPUTUSAN DIREKSI
TENTANG PENGANGKATAN KARYAWAN TETAP (PKWTT)
Nomor: {{nomor_surat}}

MENIMBANG:
a. Bahwa Saudara/i {{nama}} (NIK: {{nik}}) telah menyelesaikan masa percobaan (probation) dan menunjukkan performa kerja serta integritas yang memenuhi standar evaluasi Perusahaan.
b. Bahwa untuk mendukung kesinambungan operasional divisi {{departemen}}, dipandang perlu menetapkan status kepegawaian yang bersangkutan menjadi Karyawan Tetap.

MENGINGAT:
1. Undang-Undang Ketenagakerjaan No. 13 Tahun 2003 jo UU No. 6 Tahun 2023.
2. Peraturan Perusahaan {{nama_perusahaan}} Bab Kepegawaian & Pengangkatan.

MEMUTUSKAN
MENETAPKAN:
PERTAMA: Mengangkat Saudara/i {{nama}} (NIK KTP: {{nik_ktp}}) menjadi KARYAWAN TETAP (PKWTT) pada {{nama_perusahaan}}.
KEDUA: Menempatkan yang bersangkutan pada posisi {{jabatan}}, Departemen {{departemen}}, dengan jenjang Grade {{grade}}.
KETIGA: Terhitung sejak tanggal {{tanggal_mulai}}, yang bersangkutan berhak atas upah pokok sebesar {{gaji_pokok}} ({{gaji_terbilang}}) per bulan serta hak cuti tahunan penuh dan benefit asuransi kesehatan keluarga.
KEEMPAT: Surat Keputusan ini berlaku mengikat kedua belah pihak sejak tanggal ditetapkan.

Ditetapkan di: Jakarta
Pada tanggal: {{tanggal_terbit}}

{{nama_perusahaan}}`,
  },
  {
    id: 'sample-parklaring',
    title: 'Surat Keterangan Pengalaman Kerja (Parklaring)',
    fileName: 'Template_Surat_Pengalaman_Kerja_Parklaring.docx',
    fileSize: '24.6 KB',
    type: 'Parklaring',
    numberingPattern: '{SEQ}/HRD-PARKLARING/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    letterHeadNpwp: '01.999.888.7-011.000',
    letterHeadPhone: '+62 21 5566 7788',
    letterHeadEmail: 'legal.hr@nusantara.id',
    kopPosition: 'top' as const,
    qrPosition: 'bottom-right' as const,
    rawText: `SURAT KETERANGAN PENGALAMAN KERJA (PARKLARING)
Nomor: {{nomor_surat}}

Yang bertanda tangan di bawah ini:
Nama: {{penandatangan}}
Jabatan: {{jabatan_penandatangan}}
Perusahaan: {{nama_perusahaan}}
Alamat: {{alamat_perusahaan}}

Dengan ini menerangkan dengan sebenarnya bahwa:
Nama Lengkap: {{nama}}
Nomor Induk Karyawan: {{nik}}
Nomor KTP: {{nik_ktp}}
Departemen: {{departemen}}
Jabatan Terakhir: {{jabatan}}

Benar telah bekerja di {{nama_perusahaan}} terhitung sejak tanggal {{tanggal_mulai}} sampai dengan tanggal {{tanggal_berakhir}}.

Selama masa kerjanya, Saudara/i {{nama}} telah menunjukkan dedikasi, loyalitas, dan tanggung jawab yang sangat baik terhadap seluruh penugasan perusahaan. Hubungan kerja berakhir dengan baik atas dasar kepatuhan regulasi ketenagakerjaan.

Demikian Surat Keterangan Pengalaman Kerja ini diterbitkan dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.

Jakarta, {{tanggal_terbit}}
{{nama_perusahaan}}`,
  },
  {
    id: 'sample-sp-disiplin',
    title: 'Surat Peringatan Kedisiplinan Kerja (SP Kepatuhan)',
    fileName: 'Template_Surat_Peringatan_Kedisiplinan_SP.docx',
    fileSize: '26.8 KB',
    type: 'Surat Peringatan',
    numberingPattern: '{SEQ}/HRD-SP/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    letterHeadNpwp: '01.999.888.7-011.000',
    letterHeadPhone: '+62 21 5566 7788',
    letterHeadEmail: 'legal.hr@nusantara.id',
    kopPosition: 'top' as const,
    qrPosition: 'bottom-right' as const,
    rawText: `SURAT PERINGATAN KEDISIPLINAN KERJA (SP)
Nomor: {{nomor_surat}}

Surat Peringatan ini diberikan kepada:
Nama: {{nama}}
NIK: {{nik}}
Jabatan: {{jabatan}}
Departemen: {{departemen}}

Berdasarkan hasil pemeriksaan kehadiran dan evaluasi kedisiplinan kerja, dengan ini Manajemen {{nama_perusahaan}} menerbitkan Surat Peringatan atas pelanggaran ketentuan tata tertib Peraturan Perusahaan.

DASAR PENERBITAN & KETENTUAN HUKUM:
1. Pasal 161 UU No. 13 Tahun 2003 jo Peraturan Pemerintah No. 35 Tahun 2021.
2. Peraturan Perusahaan Bab Pembinaan & Sanksi Disiplin Karyawan.

MASA BERLAKU SANKSI:
Surat Peringatan ini memiliki masa berlaku selama 6 (enam) bulan terhitung sejak tanggal diterbitkan ({{tanggal_terbit}}). Apabila dalam kurun waktu tersebut karyawan kembali melakukan pelanggaran disiplin, maka perusahaan berhak menaikkan tingkat sanksi ke jenjang berikutnya sesuai regulasi.

Diharapkan Saudara/i {{nama}} dapat segera memperbaiki kinerja dan mematuhi seluruh norma kedisiplinan perusahaan.

Diterbitkan di: Jakarta
Tanggal: {{tanggal_terbit}}

Manajemen {{nama_perusahaan}}`,
  },
  {
    id: 'sample-bast-aset',
    title: 'Berita Acara Serah Terima Aset & Inventaris (BAST)',
    fileName: 'Template_BAST_Serah_Terima_Aset.docx',
    fileSize: '29.3 KB',
    type: 'BAST Aset',
    numberingPattern: '{SEQ}/BAST-GA/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    letterHeadNpwp: '01.999.888.7-011.000',
    letterHeadPhone: '+62 21 5566 7788',
    letterHeadEmail: 'legal.hr@nusantara.id',
    kopPosition: 'top' as const,
    qrPosition: 'bottom-right' as const,
    rawText: `BERITA ACARA SERAH TERIMA (BAST) FASILITAS & ASET KERJA
Nomor: {{nomor_surat}}

Pada hari ini, {{tanggal_terbit}}, telah dilakukan serah terima fasilitas operasional kerja antara:

PIHAK I (YANG MENYERAHKAN):
Nama: {{penandatangan}}
Jabatan: General Affairs & Asset Management
Perusahaan: {{nama_perusahaan}}

PIHAK II (YANG MENERIMA):
Nama Karyawan: {{nama}}
NIK: {{nik}}
Jabatan: {{jabatan}}
Departemen: {{departemen}}

Dengan ini Pihak I menyerahkan perangkat kerja perusahaan kepada Pihak II untuk dipergunakan sebagai sarana penunjang tugas resmi. Pihak II bertanggung jawab penuh atas pemeliharaan dan keamanan aset tersebut.

Demikian Berita Acara Serah Terima ini dibuat dengan sebenar-benarnya dalam rangkap elektronik ber-QR Code untuk dipergunakan sebagaimana mestinya.

Jakarta, {{tanggal_terbit}}`,
  },
];
