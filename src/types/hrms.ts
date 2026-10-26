export type UserRole =
  | 'super_admin'
  | 'hr_admin'
  | 'payroll_admin'
  | 'ga_admin'
  | 'manager'
  | 'employee'
  | (string & {});

export interface RoleDefinition {
  id: string;
  label: string;
  description: string;
  badgeClass?: string;
  isSystem?: boolean;
}

export interface OperationPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

export type EmploymentType = 'Tetap' | 'Kontrak' | 'Outsource' | 'Magang';

export type PTKPStatus = 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3';

export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin' | 'Cuti' | 'Alpa' | 'Dinas Luar';

export type DisciplinaryLevel = 'SP 1' | 'SP 2' | 'SP 3' | 'Skorsing' | 'PHK';

export type AssetCondition = 'Baik' | 'Perlu Perbaikan' | 'Rusak' | 'Dipinjam' | 'Hilang';

export type RecruitmentStage =
  | 'Incoming'
  | 'Screening'
  | 'Assessment'
  | 'Interview'
  | 'Medical Check-Up'
  | 'Offered'
  | 'Hired'
  | 'TalentPool'
  | 'Rejected'
  | 'Applied';

// Tenant Structure for SaaS Apps Owner
export interface Tenant {
  id: string;
  name: string;
  code: string;
  logoText: string;
  documentLogoUrl?: string; // Logo untuk Kop Dokumen Resmi / SK / Slip Gaji
  appFaviconUrl?: string; // App Favicon & Icon Tab Browser
  npwp: string;
  city: string;
  umr: number;
  workDaysPerWeek: 5 | 6;
  standardWorkHours: number;
  planTier: 'Enterprise' | 'Scale' | 'Starter';
  maxUsers?: number;
  activeStatus?: 'Active' | 'Trial' | 'Suspended';
  subscriptionRenewDate?: string;
  billingContact?: string;
  address?: string;
}

// User & RBAC for Tenant Admin
export interface UserAccount {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  avatarUrl?: string;
  customPermissions?: string[];
  department?: string;
  status?: 'Aktif' | 'Nonaktif';
  signatureUrl?: string;
  signatureEnrolledAt?: string;
}

export interface FamilyMember {
  id: string;
  relation: 'Pasangan' | 'Anak' | 'Orang Tua' | 'Mertua';
  fullName: string;
  nikKtp?: string;
  birthDate: string;
  gender: 'Laki-laki' | 'Perempuan';
  occupation?: string;
  isBpjsCovered: boolean;
  education?: string;
}

export interface EmergencyContact {
  id: string;
  fullName: string;
  relation: 'Suami/Istri' | 'Orang Tua' | 'Saudara Kandung' | 'Anak' | 'Kerabat';
  phone: string;
  address: string;
}

export interface EmployeeEducationItem {
  id: string;
  degree: 'SMA/SMK' | 'D1/D2' | 'D3' | 'D4/S1' | 'S1' | 'S2' | 'S3';
  institution: string;
  major: string;
  graduationYear: number;
  gpa?: string;
  frontTitle?: string; // Gelar Depan (misal: "Dr.", "Ir.") - berlaku untuk S1/D4 sampai S3
  backTitle?: string;  // Gelar Belakang (misal: "S.Kom.", "M.M.", "Ph.D.") - berlaku untuk S1/D4 sampai S3
}

export interface EmployeeNonFormalEducationItem {
  id: string;
  trainingName: string; // Nama Pelatihan / Kursus / Sertifikasi Profesional
  organizer: string;    // Lembaga Penyelenggara / Penerbit
  year: number | string;// Tahun / Tanggal Perolehan
  validityType: 'Permanen' | 'Memiliki Masa Berlaku';
  expiredDate?: string; // Tanggal Kadaluarsa jika memiliki masa berlaku
  certificateNumber?: string; // Nomor Sertifikat / Lisensi
}

export interface Employee {
  id: string;
  tenantId: string;
  entityId?: string;
  nik: string;
  fullName: string;
  email: string;
  phone: string;
  personalEmail?: string;
  avatar?: string; // photo profile

  // 1. Status Kerja & Dokumen Kontrak / SK
  employmentType: EmploymentType;
  contractDocNumber: string;
  candidateId?: string;
  contractStartDate: string;
  contractEndDate?: string;
  permanentAppointmentDate?: string;
  probationStatus: 'Lolos' | 'Sedang Berjalan' | 'Tanpa Percobaan';
  probationEndDate?: string;
  outsourceVendor?: string;
  sourceOfTruth?: 'native' | 'migrated';

  // 2. Organisasi & Posisi
  department: string;
  position: string;
  grade: string;
  managerId?: string;
  directSupervisor?: string;
  branchLocation?: string;
  joinDate: string;
  status: 'Aktif' | 'Cuti Panjang' | 'Resign' | 'PHK';
  remainingLeaveDays: number;
  annualLeaveBalance?: number;

  // 3. Identitas Kependudukan & Pribadi
  nikKtp: string;
  noKk: string;
  birthPlace: string;
  birthDate: string;
  gender: 'Laki-laki' | 'Perempuan';
  religion: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu' | 'Lainnya';
  maritalStatus: 'Lajang' | 'Menikah' | 'Cerai Hidup' | 'Cerai Mati';
  bloodType?: 'A' | 'B' | 'AB' | 'O';
  ktpAddress: string;
  currentAddress: string;
  postalCode?: string;
  whatsApp?: string;

  // 4. Pajak & Jaminan Sosial
  npwp: string;
  npwp16?: string;
  ptkp: PTKPStatus;
  kppPratama: string;
  bpjsTkNo: string;
  bpjsKesNo: string;
  faskes1Bpjs: string;
  hasBpjsTk?: boolean;
  hasBpjsKes?: boolean;
  bpjsTkActionNeeded?: 'Pengalihan' | 'Pembuatan Baru';
  bpjsKesActionNeeded?: 'Pengalihan' | 'Pembuatan Baru';

  // 5. Finansial & Payroll
  bankName: string;
  bankAccount: string;
  bankAccountHolder: string;
  basicSalary: number;
  salary?: number;
  fixedAllowance: number;
  transportAllowance: number;
  mealAllowance: number;
  positionAllowance: number;

  // 6. Pendidikan
  lastEducationDegree: 'SMA/SMK' | 'D3' | 'S1' | 'S2' | 'S3';
  institution: string;
  major: string;
  graduationYear: number;
  educationGpa?: number | string;
  formalEducations?: EmployeeEducationItem[];
  nonFormalEducations?: EmployeeNonFormalEducationItem[];
  titlePrefix?: string; // Gelar di depan nama (misal: "Dr.", "Ir.")
  titleSuffix?: string; // Gelar di belakang nama (misal: "S.Kom.", "M.M.")

  // 7. Keluarga & Kontak Darurat
  familyMembers: FamilyMember[];
  emergencyContacts: EmergencyContact[];
}

export type PersonaliaActionType =
  | 'Promosi'
  | 'Demosi'
  | 'Mutasi'
  | 'Mutasi Departemen'
  | 'Rotasi Cabang'
  | 'Penyesuaian Gaji'
  | 'Pengangkatan Tetap'
  | 'Perpanjangan Kontrak'
  | 'Penetapan Plt'
  | 'Penetapan Plt/Pjs';

export interface PersonaliaLog {
  id: string;
  tenantId: string;
  employeeId: string;
  type: PersonaliaActionType | string;
  previousPosition: string;
  newPosition: string;
  previousDepartment?: string;
  newDepartment?: string;
  previousGrade?: string;
  newGrade?: string;
  previousSalary: number;
  newSalary: number;
  previousAllowance?: number;
  newAllowance?: number;
  effectiveDate: string;
  letterNumber: string;
  reason: string;
  approvedBy: string;
  status?: 'Disetujui' | 'Menunggu Approval' | 'Draf' | 'Menunggu';
  notes?: string;
  newBranchLocation?: string;
  contractDurationMonths?: number;
  contractEndDate?: string;
  actingRoleExpiryDate?: string;
  permanentAppointmentDate?: string;
  disciplinaryLevel?: 'SP 1' | 'SP 2' | 'SP 3' | 'Skorsing';
  skDocNumber?: string;
}

// Shifts, Roster & Scheduling
export interface WorkShift {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
  color: string;
  isNightShift: boolean;
  lateToleranceMins: number;
}

export interface EmployeeSchedule {
  id: string;
  tenantId: string;
  employeeId: string;
  date: string;
  shiftId: string;
}

export interface ShiftSwapRequest {
  id: string;
  tenantId: string;
  requesterId: string;
  targetEmployeeId: string;
  requestDate: string;
  targetDate: string;
  reason: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  approvedBy?: string;
}

// Attendance, Corrections & Business Trips
export interface AttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: AttendanceStatus;
  overtimeHours: number;
  lateMinutes: number;
  notes?: string;
  shiftId?: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  date: string;
  type: 'Lupa Absen Masuk' | 'Lupa Absen Pulang' | 'Koreksi Jam' | 'Izin Datang Terlambat' | 'Izin Pulang Cepat' | 'Izin Sakit Tanpa Rawat';
  proposedClockIn?: string;
  proposedClockOut?: string;
  reason: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  approvedBy?: string;
  attachmentUrl?: string;
}

export interface BusinessTripRequest {
  id: string;
  tenantId: string;
  tripNumber: string;
  employeeId: string;
  destinationCity: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  purpose: string;
  transportType: 'Pesawat' | 'Kereta Api' | 'Mobil Operasional' | 'Travel';
  estimatedCost: number;
  perDiemDaily: number;
  accommodationCost: number;
  status: 'Menunggu Approval' | 'Disetujui Atasan' | 'Disetujui Finance' | 'Selesai';
  approvedBy?: string;
}

export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveType: 'Cuti Tahunan' | 'Cuti Sakit' | 'Cuti Menikah' | 'Cuti Melahirkan' | 'Izin Urusan Pribadi';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  approvedBy?: string;
}

// Multi-Level Universal Approval Center
export interface ApprovalWorkflowItem {
  id: string;
  tenantId: string;
  category:
    | 'Cuti'
    | 'Perbaikan Presensi'
    | 'Tukar Shift'
    | 'Lembur'
    | 'Pinjaman'
    | 'Promosi/Personalia'
    | 'Perjalanan Dinas'
    | 'Procurement PR'
    | 'Offboarding';
  referenceId: string;
  title: string;
  requesterId: string;
  department: string;
  submittedAt: string;
  deadlineAt: string;
  level: number;
  totalLevels: number;
  assignedApproverRole: UserRole | 'manager' | 'director';
  assignedApproverId?: string;
  substituteApproverId?: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Eskalasi Terlambat';
  amount?: number;
  notes?: string;
}

export interface ApprovalDelegation {
  id: string;
  tenantId: string;
  principalId: string;
  substituteId: string;
  startDate: string;
  endDate: string;
  reason: string;
  isActive: boolean;
}

// Payroll & Loan
export interface PayrollRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  period: string;
  basicSalary: number;
  allowances: number;
  overtimePay: number;
  reimbursement: number;
  thrBonus: number;
  grossPay: number;
  bpjsKesCompany: number;
  bpjsKesEmployee: number;
  bpjsTkCompany: number;
  bpjsTkEmployee: number;
  pph21TERCategory: 'TER A' | 'TER B' | 'TER C';
  pph21RatePercent: number;
  pph21Amount: number;
  loanDeduction: number;
  lateDeduction: number;
  unpaidLeaveDeduction?: number;
  severancePay?: number;
  totalDeductions: number;
  netPay: number;
  status: 'Draft' | 'Approved' | 'Disbursed';
  paidDate?: string;
}

export interface EmployeeLoan {
  id: string;
  tenantId: string;
  employeeId: string;
  loanType: 'Kasbon Darurat' | 'Pinjaman Fleksibel' | 'Pendidikan' | 'Kepemilikan Aset';
  totalAmount: number;
  tenorMonths: number;
  monthlyInstallment: number;
  remainingAmount: number;
  startDate: string;
  reason: string;
  status: 'Aktif' | 'Lunas' | 'Menunggu Approval';
}

// KPI Performance
export interface KPIMetric {
  id: string;
  name: string;
  target: number;
  actual: number;
  weight: number;
  unit: string;
  score: number;
}

export interface EmployeeKPI {
  id: string;
  tenantId: string;
  employeeId: string;
  period: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  metrics: KPIMetric[];
  finalScore: number;
  feedback: string;
  reviewer: string;
  evaluatedAt: string;
}

// Compliance & SP
export interface ComplianceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  level: DisciplinaryLevel;
  violationReason: string;
  letterNumber: string;
  issueDate: string;
  validUntil: string;
  signedBy: string;
  status: 'Aktif' | 'Kedaluwarsa' | 'Dibatalkan';
}

// 1. Permintaan Karyawan Baru (FPTK / Job Requisition)
export type FptkPositionReason =
  | 'Posisi Baru (New Position)'
  | 'Penggantian Karyawan Resign'
  | 'Penggantian Mutasi / Dipindahkan'
  | 'Penggantian Promosi Jabatan'
  | 'Kebutuhan Proyek Khusus'
  | 'Penambahan Headcount'
  | 'Ekspansi Bisnis'
  | 'Lainnya';

export interface FptkSignatory {
  id: string;
  role: string; // e.g. 'Menyetujui' | 'Mengetahui' | 'Memeriksa' | 'Mengesahkan'
  employeeId?: string;
  name: string;
  title: string;
  nik?: string;
  avatar?: string;
  withDegree?: boolean;
  status?: 'Menunggu Approval' | 'Disetujui' | 'Ditolak';
  date?: string;
  notes?: string;
}

export interface JobRequisition {
  id: string;
  tenantId: string;
  reqNumber: string;
  position: string; // Nama Posisi / Jabatan
  department: string;
  grade: string; // Tampilan Grade (e.g. 'Grade 2 s/d Grade 3')
  gradeMin?: string; // Grade Opsi Dari (e.g. 'Grade 1 - Staff')
  gradeMax?: string; // Grade Opsi Sampai (e.g. 'Grade 3 - Lead / Supervisor')
  headcount: number; // Jumlah yang dibutuhkan
  reason: FptkPositionReason | string; // Alasan: Posisi baru / Resign / Dipindah / Promosi
  replacementFor?: string; // Nama karyawan sebelumnya jika penggantian
  isBudgeted?: boolean; // Dianggarkan atau tidak (Budgeted vs Unbudgeted)
  justification?: string; // Penjelasan kebutuhan deskriptif (justifikasi)
  targetJoinDate: string; // Tanggal dibutuhkan (Target Masuk)
  
  // Struktur Organisasi & Supervisi
  reportingToDepartment?: string; // Bertanggung jawab ke divisi / departemen apa
  reportingToTitle?: string; // Bertanggung jawab ke jabatan/posisi apa
  reportingToEmployeeId?: string;
  supervisedStaffCount?: number; // Jumlah staff yang disupervisi (0 jika IC)
  mainResponsibilities?: string; // Tugas utama / deskripsi tanggung jawab

  // Kualifikasi
  educationLevel?: string; // Strata Pendidikan (SMA/SMK, D3, S1, S2, S3)
  educationMajor?: string; // Jurusan / Bidang Studi
  educationMin?: string; // Gabungan Strata & Jurusan
  minExperience?: string; // Lama pengalaman kerja
  skills?: string; // Keterampilan / Keahlian teknis & soft skills
  otherRequirements?: string; // Kualifikasi lainnya / sertifikasi
  requirements: string; // Ringkasan requirement lengkap

  // Pengajuan & Persetujuan (Fleksibel)
  requesterName: string; // Yang mengajukan (Nama & Jabatan Pembuat Form)
  requesterTitle?: string;
  approvedBy?: string; // Yang menyetujui utama
  approverTitle?: string;
  approvalDate?: string;
  approvalNotes?: string;
  signatories?: FptkSignatory[]; // Daftar penanda tangan / approval berjenjang yang fleksibel

  retractedAt?: string; // Tanggal & waktu pencabutan FPTK setelah disetujui
  retractedReason?: string; // Alasan pencabutan (Budget freeze, restrukturisasi, pembatalan direksi)
  retractedBy?: string; // Nama otoritas yang mencabut pengajuan FPTK

  status: 'Disetujui' | 'Menunggu Approval' | 'Draft' | 'Ditolak' | 'Dibatalkan' | 'Dicabut (Retracted)';
  createdAt: string;
}

// 2. Sourcing & Multi-Channel Job Posting
export type JobPostingChannel = 'Jobstreet' | 'LinkedIn' | 'Glints' | 'Kalibrr' | 'Website Karir' | 'Website Karir Internal';

export interface JobVacancy {
  id: string;
  tenantId: string;
  title: string;
  department: string;
  employmentType: EmploymentType;
  openings: number;
  minExperience: string;
  salaryRange: string;
  status: 'Buka' | 'Ditutup';
  postedDate: string;
  grade?: string;
  requirements?: string;
  description?: string;
  jobRequisitionId?: string;
  activeChannels?: JobPostingChannel[];
  channelBroadcastStatus?: { [key in JobPostingChannel]?: 'Terkirim' | 'Aktif' | 'Nonaktif' };
  applicantsCount?: number;
  showSalaryPublicly?: boolean;
  rawInternalSalary?: string;
  externalDescription?: string;
}

// 3. Incoming & Resume Parsing Data
export interface CandidateParsedData {
  fullName: string;
  email: string;
  phone: string;
  currentTitle: string;
  currentCompany: string;
  totalExperienceYears: number;
  education: string;
  university: string;
  topSkills: string[];
  extractionScore: number;
  parsedAt: string;
}

export interface CandidateCompetencyScore {
  id: string;
  testTypeId: string;
  testTypeName: string;
  category: string;
  score: number;
  passingGrade: number;
  status: 'Lulus' | 'Tidak Lulus';
  evaluatedAt: string;
  evaluator?: string;
  notes?: string;
  details?: Record<string, any>;
}

export interface CandidateAssignedTest {
  id: string;
  testTypeId: string;
  testTypeName: string;
  category: string;
  format: 'Online' | 'Offline';
  durationMinutes: number;
  testDescription?: string; // Deskripsi konten tes
  expectedOutput?: string; // Output yang diharapkan dari tes
  testUrlOrRepo?: string; // Tautan portal tes atau starter kit
  testToken?: string; // Token unik link tes sekali pakai
  tokenExpiresAt?: string; // Batas limit waktu berlaku link
  isTokenUsed?: boolean; // Tanda apakah link sudah disubmit / hangus
  testStartedAt?: string; // Waktu kandidat klik mulai tes
  submittedUrl?: string; // Tautan hasil pengerjaan yang disubmit pelamar
  submittedNotes?: string; // Catatan solusi / penjelasan teknis dari pelamar
  submittedAt?: string; // Waktu submit hasil tes
  offlineRoomName?: string; // Ruangan / fasilitas yang dibooking
  offlineTestDate?: string; // Tanggal tes offline
  offlineStartTime?: string; // Jam mulai
  offlineEndTime?: string; // Jam selesai
  offlineFacilities?: string[]; // Fasilitas yang disediakan di ruangan
  offlineDefaultFacilities?: string[]; // Fasilitas & peralatan bawaan default ruangan
  offlineRequestedFacilities?: string[]; // Fasilitas & peralatan tambahan yang diminta by request
  offlineRequestNotes?: string; // Catatan tambahan kebutuhan khusus ke GA/IT
  offlineEquipmentNotes?: string; // Catatan perlengkapan untuk pelamar
  locationOrSandboxNotes?: string;
  assessorName: string;
  assessorRole?: string;
  assessorEmail?: string;
  invitationSent?: boolean;
  invitationSentAt?: string;
  passingGrade: number;
  score?: number;
  status?: 'Belum Dinilai' | 'Lulus' | 'Tidak Lulus';
  evaluatedAt?: string;
  evaluationNotes?: string;
  criteriaScores?: Record<string, number>;
}

export interface CompetencyTestTypeSetting {
  id: string;
  name: string;
  category: 'Hard Skill' | 'Soft Skill' | 'Kognitif & Logika' | 'Bahasa' | 'Studi Kasus' | 'Praktik Kerja';
  passingGrade: number;
  durationMinutes: number;
  method: 'Online Test' | 'Live Coding' | 'Presentasi' | 'Tatap Muka' | 'Studi Kasus Mandiri';
  description: string;
  weightPercent?: number;
  isActive: boolean;
}

export interface InterviewScorecardCriterion {
  id: string;
  name: string;
  description?: string;
  weightPercent?: number;
}

export interface InterviewTypeSetting {
  id: string;
  name: string;
  targetRole?: string;
  description: string;
  interviewerRoles?: string;
  criteria: InterviewScorecardCriterion[];
  isActive: boolean;
}

export interface AssignedInterviewer {
  id: string;
  employeeId?: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
  status?: 'Terkonfirmasi' | 'Menunggu Respon' | 'Reschedule Diminta' | 'Berhalangan';
  notes?: string;
  // Per-interviewer individual evaluation:
  scorecardRatings?: Record<string, number>;
  averageStars?: number;
  calculatedScore?: number;
  recommendation?: 'Sangat cocok' | 'Dipertimbangkan' | 'Kurang cocok' | 'Tidak cocok';
  evaluationNotes?: string;
  evaluatedAt?: string;
}

export interface InterviewerChangeHistory {
  id: string;
  timestamp: string;
  action: 'Ganti Pewawancara' | 'Pewawancara Berhalangan' | 'Tambah Pewawancara' | 'Hapus Pewawancara';
  previousInterviewer?: string;
  newInterviewer?: string;
  reason: string;
  recordedBy: string;
}

export interface CandidateInterviewEvaluation {
  id: string;
  interviewTypeId: string;
  interviewTypeName: string;
  interviewDate: string;
  interviewer: string;
  interviewers?: AssignedInterviewer[];
  platform: 'Google Meet' | 'Microsoft Teams' | 'Ruang Interview Kantor' | string;
  meetingLink?: string;
  scorecardRatings: Record<string, number>;
  averageStars: number;
  calculatedScore: number;
  recommendation: 'Direkomendasikan Lolos' | 'Dipertimbangkan' | 'Tidak Direkomendasikan';
  userRecommendation?: string;
  systemObjectiveRecommendation?: {
    compositeScore: number;
    testScore: number;
    interviewScore: number;
    status: 'Sangat Direkomendasikan' | 'Dipertimbangkan' | 'Tidak Direkomendasikan';
    rationale: string;
  };
  notes: string;
  evaluatedAt: string;
}

export interface Candidate {
  id: string;
  tenantId: string;
  jobVacancyId: string;
  name: string;
  email: string;
  phone: string;
  lastCompany: string;
  expectedSalary: number;
  stage: RecruitmentStage;
  appliedDate: string;

  // 2. Sourcing Source
  sourcePortal?: JobPostingChannel | 'Referral' | 'Walk-in';

  // 3. Incoming & Resume Parsing
  resumeParsed?: boolean;
  parsedData?: CandidateParsedData;
  cvFileName?: string;
  cvFileSize?: string;

  // 4. Screening & AI Match
  aiMatchScore?: number; // 0 - 100
  matchedKeywords?: string[];
  missingKeywords?: string[];
  isShortlisted?: boolean;
  screeningNotes?: string;

  // 5. Assessment / Test
  testType?: string;
  testScore?: number; // 0 - 100
  testPassingGrade?: number;
  testStatus?: 'Belum Ditugaskan' | 'Terkirim' | 'Sedang Mengerjakan' | 'Lulus' | 'Tidak Lulus';
  testNotes?: string;
  testAssignedDate?: string;
  competencyScores?: CandidateCompetencyScore[];
  assignedTests?: CandidateAssignedTest[];
  overallAssessmentStatus?: 'Belum Ditugaskan' | 'Sedang Berlangsung' | 'Lulus Memenuhi Syarat' | 'Di Bawah Passing Grade';
  overallAssessmentScore?: number;

  // 6. Interview
  interviewDate?: string;
  interviewTimeEnd?: string;
  interviewer?: string;
  interviewers?: AssignedInterviewer[];
  interviewScore?: number;
  interviewNotes?: string;
  userRecommendation?: string;
  interviewFormat?: 'Online' | 'Offline';
  interviewStartTime?: string;
  interviewFacilityRoom?: string;
  interviewFacilityRoomBookingId?: string;
  interviewOfflineRequestedFacilities?: string[];
  interviewStep?: 1 | 2 | 3;
  interviewNotificationsSent?: boolean;
  interviewNotificationsSentAt?: string;
  interviewerChangeHistory?: InterviewerChangeHistory[];
  meetingPlatform?: 'Google Meet' | 'Microsoft Teams' | 'Ruang Interview Kantor' | string;
  meetingLink?: string;
  candidateAttendanceStatus?: 'Terkonfirmasi Hadir' | 'Menunggu Respon' | 'Minta Reschedule' | 'Tidak Hadir';
  interviewScheduleStatus?: 'Belum Dijadwalkan' | 'Menunggu Konfirmasi' | 'Terkonfirmasi (Siap Hari-H)' | 'Dijadwalkan' | 'Reschedule Diminta' | 'Jadwal Diperbarui' | 'Selesai' | 'Dibatalkan';
  rescheduleReason?: string;
  rescheduleHistory?: Array<{
    previousDate: string;
    newDate: string;
    reason: string;
    requestedBy: string;
    rescheduledAt: string;
  }>;
  systemObjectiveRecommendation?: {
    compositeScore: number;
    testScore: number;
    interviewScore: number;
    status: 'Sangat Direkomendasikan' | 'Dipertimbangkan' | 'Tidak Direkomendasikan';
    rationale: string;
  };
  interviewTypeId?: string;
  interviewTypeName?: string;
  interviewScorecard?: {
    technical?: number;
    culturalFit?: number;
    communication?: number;
    ratings?: Record<string, number>;
    recommendation: 'Direkomendasikan Lolos' | 'Dipertimbangkan' | 'Tidak Direkomendasikan';
  };
  interviewEvaluations?: CandidateInterviewEvaluation[];

  // 6b. Medical Check-Up (MCU) - Opsional / Fleksibel
  mcuStatus?: 'Belum Dijadwalkan' | 'Dijadwalkan' | 'Menunggu Hasil Lab' | 'Fit (Lolos)' | 'Fit with Note' | 'Unfit (Gugur)';
  mcuDate?: string;
  mcuClinicOrHospital?: string;
  mcuPackage?: string;
  mcuNotes?: string;
  mcuResultDocument?: string;
  mcuDecision?: 'Lolos ke Offering' | 'Perlu Pemeriksaan Ulang' | 'Gugur / Unfit';

  // 7. Offering
  offeredSalary?: number;
  offeringDocNumber?: string;
  offeringSentDate?: string;
  offeringStatus?: 'Draft' | 'Terkirim' | 'Diterima' | 'Negosiasi' | 'Ditolak';
  offeringCandidateResponse?: 'Cocok' | 'Nego' | 'Tidak Cocok';
  offeringResponseNotes?: string;
  offeringResponseDate?: string;
  offeringBreakdown?: {
    mode: 'gross' | 'net';
    basicSalary: number;
    allowances: Array<{
      id: string;
      name: string;
      category: string;
      type: 'fixed' | 'percent';
      value: number;
      amount: number;
    }>;
    totalAllowances: number;
    grossSalary: number;
    ptkp: PTKPStatus;
    terCategory: string;
    terRatePercent: number;
    taxAmount: number;
    bpjsEmployee: {
      kes: number;
      jht: number;
      jp: number;
      total: number;
    };
    bpjsCompany: {
      kes: number;
      jht: number;
      jkk: number;
      jkm: number;
      jp: number;
      total: number;
    };
    privateInsurances: Array<{
      id?: string;
      name: string;
      companyAmount: number;
      employeeAmount: number;
    }>;
    totalEmployeeDeductions: number;
    takeHomePay: number;
    costToCompany: number;
  };
  offeringPosition?: string;
  offeringUnitKerja?: string;
  offeringStartDate?: string;
  offeringEmploymentStatus?: string;

  // 8. Hired / Disqualified / Talent Pool
  joinedDate?: string;
  isEmployeeCreated?: boolean;
  createdEmployeeId?: string;
  disqualificationReason?: string;
  talentPoolCategory?: string;
  talentPoolTags?: string[];
  lastStageName?: string;
  lastStageScore?: number;
  lastStageDate?: string;
  lastStageLocation?: string;
  lastStageInterviewer?: string;
  lastStageNotes?: string;
}

export interface OfferingCalculationState {
  docNumber: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  department: string;
  employmentType: EmploymentType;
  mode: 'gross' | 'net';
  targetAmount: number;
  ptkp: PTKPStatus;
  components: {
    basicSalary: number;
    fixedAllowance: number;
    positionAllowance: number;
    transportAllowance: number;
    mealAllowance: number;
    communicationAllowance: number;
    healthPrivateInsurance: number;
    performanceBonus: number;
    thrBonus: number;
  };
  enabledComponents: {
    fixedAllowance: boolean;
    positionAllowance: boolean;
    transportAllowance: boolean;
    mealAllowance: boolean;
    communicationAllowance: boolean;
    healthPrivateInsurance: boolean;
    performanceBonus: boolean;
    thrBonus: boolean;
  };
  benefits: string[];
}

// Offboarding
export interface OffboardingRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  separationType: 'Resign Sukarela' | 'Habis Kontrak' | 'PHK Efisiensi' | 'PHK Indisipliner';
  requestDate: string;
  effectiveDate: string;
  handoverCompleted: boolean;
  assetReturned: boolean;
  financeCleared: boolean;
  severancePay: number;
  parklaringIssued: boolean;
  parklaringNumber?: string;
  notes: string;
}

// GA: Assets, Relocations & Maintenance Tickets
export interface GAAsset {
  id: string;
  tenantId: string;
  assetCode: string;
  name: string;
  category: 'Laptop & Komputer' | 'Kendaraan Operasional' | 'Fasilitas Gedung' | 'Furniture' | 'Perangkat Jaringan';
  building: string;
  room: string;
  purchaseDate: string;
  purchasePrice: number;
  condition: AssetCondition;
  assignedToEmployeeId?: string;
  lastStockOpname: string;
  qrPayload: string;
  usageStatus?: 'Tersedia' | 'Digunakan' | 'Dalam Perbaikan';
}

export interface AssetMaintenanceTicket {
  id: string;
  tenantId: string;
  ticketNumber: string;
  assetCode: string;
  assetName: string;
  reporterEmployeeId: string;
  issueType: 'Kerusakan Hardware' | 'Perawatan Rutin' | 'Perbaikan Fasilitas / Gedung' | 'Permintaan Penggantian';
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat';
  description: string;
  reportedAt: string;
  status: 'Tiket Dibuka' | 'Sedang Dikerjakan GA' | 'Menunggu Sparepart' | 'Selesai Diperbaiki' | 'Aset Diganti Baru';
  assignedTechnician?: string;
  cost?: number;
  resolutionNotes?: string;
}

export interface AssetRelocationLog {
  id: string;
  tenantId: string;
  assetCode: string;
  assetName: string;
  fromBuilding: string;
  fromRoom: string;
  fromEmployeeId?: string;
  toBuilding: string;
  toRoom: string;
  toEmployeeId?: string;
  relocationDate: string;
  approvedBy: string;
  notes: string;
}

// Procurement: Vendor, Quotation, PO, Work Contract & Project
export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  category: 'Hardware & IT' | 'Konstruksi & Fasilitas' | 'ATK & Cetak' | 'Jasa Konsultan / Project' | 'Event & Logistik';
  contactPerson: string;
  phone: string;
  email: string;
  npwp: string;
  rating: number; // 1-5
  address: string;
  isVerified: boolean;
}

export interface ProcurementOrder {
  id: string;
  tenantId: string;
  type?: 'Pengadaan Barang' | 'Project / Jasa' | 'Barang' | 'Proyek / Jasa Kontrak';
  prNumber: string;
  poNumber: string;
  quotationNumber?: string;
  contractNumber?: string;
  vendorId?: string;
  vendorName: string;
  itemName: string;
  quantity: number;
  estimatedCost: number;
  requestor: string;
  department: string;
  status: 'Pengajuan PR' | 'Quotation Diterima' | 'Disetujui HR/Finance' | 'PO Terbit' | 'Kontrak Berjalan' | 'Barang Diterima / Project Selesai' | 'Barang Diterima';
  requestedDate: string;
}

export type DocumentType =
  | 'PKWT'
  | 'PKWTT'
  | 'Surat Promosi'
  | 'Surat Peringatan'
  | 'Parklaring'
  | 'BAST Aset'
  | 'Offering Letter'
  | 'Surat Tugas Dinas'
  | 'Surat Perintah Perjalanan Dinas'
  | 'Surat Keputusan Cuti';

// Document Templates & Custom Formatting
export interface DocumentTemplateConfig {
  id: string;
  tenantId: string;
  type: DocumentType | string;
  name: string;
  numberingPattern: string; // e.g. "{SEQ}/HRD-PKWT/{TENANT}/{ROMAN_MONTH}/{YEAR}"
  letterHeadTitle: string;
  letterHeadAddress: string;
  letterHeadNpwp?: string;
  letterHeadPhone?: string;
  letterHeadEmail?: string;
  defaultBody: string;
  showQrSignature: boolean;
  signeeTitle: string;
  signeeRole: string;
  // DOCX Template Upload & Custom Formatting
  sourceType?: 'system' | 'uploaded_docx';
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  rawHtmlTemplate?: string;
  extractedPlaceholders?: string[];
  kopPosition?: 'top' | 'none' | 'embedded';
  qrPosition?: 'bottom-right' | 'bottom-left' | 'inline' | 'none';
  footerText?: string;
}

export type DocumentTemplate = DocumentTemplateConfig;

export interface OfficialDocument {
  id: string;
  tenantId: string;
  documentNumber: string;
  type: DocumentType | string;
  templateId?: string;
  title: string;
  targetEmployeeId: string;
  issueDate: string;
  signeeName: string;
  signeeRole: string;
  qrVerificationUrl: string;
  status: 'Resmi Diterbitkan' | 'Draft';
  contentPreview: string;
  renderedHtml?: string;
  isFromDocxTemplate?: boolean;
}

export interface MigrationRowPreview {
  nik: string;
  nama: string;
  email: string;
  status: string;
  departemen: string;
  jabatan: string;
  gajiPokok: number;
  ptkp: string;
  saldoCuti: number;
  isValid: boolean;
  validationError?: string;
}

// Onboarding Types (Via Rekrutmen vs Direct Onboarding)
export type OnboardingChecklistType = 'automatic_action' | 'manual';
export type OnboardingTargetDepartment = 'GA' | 'IT' | 'HR' | 'Finance' | 'UserDept';
export type OnboardingActionType =
  | 'id_card_request'
  | 'dossier_verification'
  | 'laptop_provisioning'
  | 'account_email_setup'
  | 'contract_signing'
  | 'custom_action';

export interface OnboardingSubItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface OnboardingChecklistTemplateItem {
  id: string;
  title: string;
  category: string;
  targetDepartment: OnboardingTargetDepartment;
  verificationType: OnboardingChecklistType;
  actionType?: OnboardingActionType;
  isMandatory: boolean;
  description?: string;
  subItems?: string[];
}

export interface OnboardingTask {
  id: string;
  title: string;
  category: 'Legalitas & Dokumen' | 'Fasilitas & IT' | 'Pengenalan & HR' | 'Payroll & Rekening' | 'Fasilitas & GA' | 'Inventaris & IT';
  isCompleted: boolean;
  completedAt?: string;
  assignedRole: string;
  verificationType?: OnboardingChecklistType;
  targetDepartment?: OnboardingTargetDepartment;
  actionType?: OnboardingActionType;
  isMandatory?: boolean;
  subItems?: OnboardingSubItem[];
  actionPayload?: {
    // ID Card request data
    idCardTicketNo?: string;
    idCardType?: string;
    idCardAccessRooms?: string[];
    idCardPhotoUrl?: string;
    // Dossier data
    dossierUploadedDocs?: string[];
    dossierKtpNumber?: string;
    dossierNpwpNumber?: string;
    dossierBpjsTkNumber?: string;
    dossierBpjsKesNumber?: string;
    dossierAddressKtp?: string;
    dossierEmergencyContact?: string;
    dossierCompleted?: boolean;
    // Laptop data
    laptopDeviceType?: string;
    laptopSerialNo?: string;
    laptopAssetTag?: string;
    laptopAccessories?: string[];
    // Account & Corporate Email data
    corporateEmail?: string;
    temporaryPassword?: string;
    provisionedAccounts?: Array<{ systemName: string; username: string; status: string }>;
    notes?: string;
    submittedAt?: string;
  };
}

export interface OnboardingProcess {
  id: string;
  tenantId: string;
  type: 'via_recruitment' | 'direct';
  candidateId?: string;
  employeeName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  employmentType: EmploymentType;
  joinDate: string;
  basicSalary: number;
  contractDocNumber: string;
  ndaDocNumber?: string;
  isContractSigned?: boolean;
  isContractLocked?: boolean;
  contractLockedAt?: string;
  tasks: OnboardingTask[];
  status: 'In Progress' | 'Completed' | 'Cancelled';
  createdEmployeeId?: string;
  officialNik?: string;
  cancellationReason?: string;
  cancelledAt?: string;
}

// Module Configuration Settings
export interface ModuleSettingsConfig {
  employee: {
    nikPrefix: string;
    probationDurationMonths: number;
    defaultRetirementAge: number;
    mandatoryDocs: string[];
    flexibleNik?: FlexibleNikSettings;
  };
  attendance: {
    lateGracePeriodMins: number;
    latePenaltyPerHour: number;
    unpaidLeaveCutDaily: boolean;
    overtimeMultiplierPP35: boolean;
    gpsRadiusMeters: number;
    cameraSelfieRequired: boolean;
  };
  payroll: {
    cutoffDate: number;
    paydayDate: number;
    bpjsKesEmployeeRate: number;
    bpjsKesCompanyRate: number;
    bpjsTkJhtEmployeeRate: number;
    bpjsTkJhtCompanyRate: number;
    defaultTERCategory: string;
  };
  loan: {
    maxPlafonSalaryPercent: number;
    maxTenorMonths: number;
    interestRatePercent: number;
    allowMultipleActiveLoans: boolean;
  };
  approval: {
    defaultSlaHours: number;
    autoEscalateOnExpiry: boolean;
    requireAttachment: boolean;
  };
  procurement: {
    minQuotesRequired: number;
    directorApprovalThreshold: number;
    ppnPercent: number;
  };
  documents: {
    companyHeaderUrl: string;
    defaultSigneeName: string;
    defaultSigneeRole: string;
    showQrSignature: boolean;
    watermarkText: string;
  };
}

// NIK Flexible Configuration per Employment Type
export interface NikPatternConfig {
  pattern: string; // e.g. "{ENTITY}-TTP/{YYYY}/{SEQ:4}"
  counter: number; // next sequence number e.g. 1
  digitPadding: number; // e.g. 4 (0001) or 3 (001)
  resetCycle: 'yearly' | 'monthly' | 'never';
  prefix?: string;
  suffix?: string;
  description?: string;
}

export interface FlexibleNikSettings {
  permanent: NikPatternConfig;   // Karyawan Tetap
  contract: NikPatternConfig;    // Karyawan Kontrak
  internship: NikPatternConfig;  // Karyawan Magang
  freelance?: NikPatternConfig;  // Harian Lepas / Freelance
}

// Master Divisi & Departemen
export interface CompanyDivision {
  id: string;
  entityId: string;
  code: string;
  name: string;
  headEmployeeId?: string;
  headTitle?: string;
  description?: string;
}

export interface CompanyDepartment {
  id: string;
  entityId: string;
  divisionId?: string;
  code: string;
  name: string;
  headEmployeeId?: string;
  headTitle?: string;
  description?: string;
}

// Master Standar Jabatan (Kamus / Katalog Jabatan Perusahaan)
export interface MasterJobPosition {
  id: string;
  entityId: string;
  code: string;
  title: string;
  defaultLevel: number; // 1: Direksi, 2: VP/Head, 3: Manager, 4: Supervisor, 5: Staff
  division?: string;
  department?: string;
  jobFamily?: string;   // e.g. 'Eksekutif', 'Teknologi', 'People & Culture', 'Keuangan', 'Operasional'
  jobGrade?: string;    // e.g. 'Grade 10', 'Grade 08' or 'Grade 07 - Grade 09'
  minGrade?: string;    // for broadbanding scheme
  maxGrade?: string;    // for broadbanding scheme
  gradingScheme?: 'single' | 'broadbanding';
  description?: string;
  requirements?: string;
}

// 22. Holding & Subsidiary Entity Structure
export interface CompanyEntity {
  id: string;
  tenantId: string;
  parentEntityId?: string; // empty if Holding
  name: string;
  code: string;
  relationType: 'resmi' | 'administratif';
  level: 'holding' | 'anak' | 'cucu';
  address: string;
  city: string;
  npwp: string;
  nikPattern: string; // e.g. "{ENTITY}-{YYYY}-{SEQ:3}"
  docPrefix: string;
  status: 'Aktif' | 'Nonaktif';
  useDepartmentLevel?: boolean; // Fleksibel: true jika butuh departemen, false jika lean (Divisi langsung ke Jabatan)
  nikSettings?: FlexibleNikSettings;
}

// 23. Employee Staging (Onboarding Gate)
export interface EmployeeStaging {
  id: string;
  tenantId: string;
  entityId: string;
  tempNik: string; // format "TEMP-XXXX"
  candidateId?: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  managerId?: string;
  employmentType: EmploymentType;
  joinDate: string;
  basicSalary: number;
  contractDocNumber: string;
  tasks: OnboardingTask[];
  status: 'In Progress' | 'Completed' | 'Withdrawn';
  contractSigned: boolean;
  ndaSigned: boolean;
  docsVerified: boolean;
}

// 24. Overtime Request & Approval Flow
export interface OvertimeRequest {
  id: string;
  tenantId: string;
  entityId?: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  type: 'Pengajuan Karyawan' | 'Perintah Atasan';
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  approvedBy?: string;
  approvedHours?: number;
  compensationType: 'Lembur Berbayar' | 'Cuti Pengganti';
  notes?: string;
}

// 25. Reimbursement Claim & Payroll Opt-In
export interface ReimbursementClaim {
  id: string;
  tenantId: string;
  entityId?: string;
  employeeId: string;
  claimNumber: string;
  category: 'Kesehatan / Rawat Jalan' | 'Kacamata' | 'Transportasi Dinas' | 'Komunikasi & Internet' | 'Pelatihan' | 'Lainnya';
  amount: number;
  description: string;
  receiptDate: string;
  receiptNumber?: string;
  proofUrl?: string;
  status: 'Menunggu Review' | 'Disetujui' | 'Ditolak';
  processInPayroll: boolean;
  processedPeriod?: string;
  approvedBy?: string;
  notes?: string;
}

// 26. Personalia Request (Requires Approval Before Effective)
export interface PersonaliaRequest {
  id: string;
  tenantId: string;
  entityId?: string;
  employeeId: string;
  type: 'Promosi' | 'Demosi' | 'Mutasi' | 'Penyesuaian Gaji' | 'Koreksi & Update Data Pribadi' | 'Tambah Data Baru';
  previousPosition?: string;
  newPosition?: string;
  previousSalary?: number;
  newSalary?: number;
  previousDepartment?: string;
  newDepartment?: string;
  previousEntityId?: string;
  newEntityId?: string;
  mutationType?: 'internal_departemen' | 'lintas_entitas_resmi' | 'lintas_entitas_administratif';
  personalDataUpdates?: Partial<Employee>;
  reason: string;
  effectiveDate: string;
  status: 'Menunggu Approval' | 'Disetujui' | 'Ditolak';
  approvedBy?: string;
  skDocumentNumber?: string;
}

// 27. Org Chart & Structure Change Proposals
export interface OrgStructureNode {
  id: string;
  entityId: string;
  title: string;
  department: string;
  division?: string;
  code?: string;
  jobGrade?: string;
  description?: string;
  reportsToId?: string;
  relationType?: 'struktural' | 'administratif';
  currentEmployeeId?: string;
  isVacant: boolean;
  level: number;
  masterJobPositionId?: string;
}

export interface OrgChangeProposal {
  id: string;
  tenantId: string;
  entityId: string;
  category?: 'organisasi' | 'perusahaan';
  proposalTitle: string;
  changeType: 'Pindah Atasan' | 'Buat Posisi Baru' | 'Hapus Posisi' | 'Restrukturisasi Departemen' | 'Tambah Entitas Perusahaan' | 'Ubah Struktur Perusahaan' | 'Likuidasi Entitas' | 'Koreksi Typo / Administratif' | 'Restrukturisasi Menyeluruh (Draft Baru)';
  description: string;
  effectiveDate: string;
  skDocNumber?: string;
  skDocFileName?: string;
  skDocUrl?: string;
  status: 'Draft' | 'Menunggu Approval' | 'Disetujui' | 'Ditolak';
  proposedBy: string;
  approvedBy?: string;
  implemented: boolean;
  isCorrectionOnly?: boolean;
  payload?: any;
  createdAt?: string;
  rejectionReason?: string;
}

export interface OrgStructureSnapshot {
  id: string;
  tenantId: string;
  entityId: string;
  proposalId?: string;
  skDocNumber?: string;
  versionTitle: string;
  effectiveDate: string;
  archivedAt: string;
  archivedBy: string;
  reason: string;
  divisions: CompanyDivision[];
  departments: CompanyDepartment[];
  orgNodes: OrgStructureNode[];
}

// 28. Probation Evaluation
export interface ProbationEvaluation {
  id: string;
  tenantId: string;
  employeeId: string;
  supervisorId: string;
  evaluationDate: string;
  technicalSkillScore: number;
  disciplineScore: number;
  teamworkScore: number;
  initiativeScore: number;
  overallScore: number;
  recommendation: 'Lulus' | 'Perpanjang Probation' | 'Tidak Lulus';
  extensionDurationMonths?: number;
  notes: string;
  status: 'Draft' | 'Menunggu Approval' | 'Disetujui' | 'Ditolak';
  approvedBy?: string;
  skDocNumber?: string;
}

// 29. Contract Renewal (PKWT)
export interface ContractRenewalReview {
  id: string;
  tenantId: string;
  employeeId: string;
  currentContractEnd: string;
  recommendation: 'Perpanjang PKWT' | 'Alih Status PKWTT (Tetap)' | 'Tidak Diperpanjang';
  newDurationMonths?: number;
  notes: string;
  status: 'Menunggu Approval' | 'Disetujui' | 'Ditolak';
  approvedBy?: string;
  newContractDocNumber?: string;
}

// 30. Company Calendar & Leave Buckets
export interface CompanyCalendarEvent {
  id: string;
  tenantId: string;
  entityId?: string;
  title: string;
  date: string;
  type: 'Libur Nasional' | 'Cuti Bersama Perusahaan';
  deductsLeaveBucket: boolean;
  description?: string;
}

// 31. Grade & Salary Ranges
export interface GradeSalaryRange {
  id: string;
  tenantId: string;
  entityId?: string;
  gradeCode: string;
  gradeName: string;
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  effectiveDate: string;
  version: number;
  notes?: string;
}

// 32. Salary Components Master & Assignments
export interface SalaryComponentMaster {
  id: string;
  tenantId: string;
  entityId?: string;
  code: string;
  name: string;
  category: 'Tunjangan Tetap' | 'Tunjangan Tidak Tetap' | 'Asuransi Pemerintah' | 'Asuransi Swasta' | 'Potongan';
  calculationBasis: 'Nominal Tetap' | 'Persen Gaji Pokok';
  defaultValue: number;
  isTaxable: boolean;
  isBpjsBase: boolean;
  description?: string;
}

export interface EmployeeSalaryComponentAssignment {
  id: string;
  tenantId: string;
  employeeId: string;
  componentId: string;
  amount: number;
  effectiveDate: string;
  isActive: boolean;
}

// 33. General Affairs Facilities, Fleet & Supply
export interface GARoomBooking {
  id: string;
  tenantId: string;
  entityId?: string;
  roomName: string;
  floorLocation: string;
  capacity: number;
  organizerId: string;
  meetingTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  attendeesInternal: string[];
  attendeesExternal: { name: string; organization: string; email: string; phone?: string; checkedIn?: boolean }[];
  status: 'Terkonfirmasi' | 'Berjalan' | 'Selesai' | 'Dibatalkan';
  bookingDocNumber?: string;
  momNotes?: string;
  momDocNumber?: string;
  momRecordedBy?: string;
}

export interface GAVehicleBooking {
  id: string;
  tenantId: string;
  entityId?: string;
  vehicleName: string;
  plateNumber: string;
  driverType: 'Sopir Kantor' | 'Bawa Sendiri';
  driverName: string;
  borrowerId: string;
  purpose: string;
  destination: string;
  startDate: string;
  endDate: string;
  startOdometer: number;
  endOdometer?: number;
  fuelCost?: number;
  status: 'Menunggu Approval' | 'Disetujui' | 'Sedang Digunakan' | 'Dikembalikan';
  formDocNumber?: string;
  nextServiceDate: string;
  taxExpiryDate: string;
}

export interface GAOfficeSupply {
  id: string;
  tenantId: string;
  itemCode: string;
  itemName: string;
  category: 'Kertas & Dokumen' | 'Alat Tulis' | 'Tinta & Toner' | 'Peralatan Kantor' | 'Kebersihan & Pantry';
  currentStock: number;
  unit: string;
  reorderPoint: number;
  standardReorderQty: number;
  estimatedUnitPrice: number;
}

export interface GAOfficeSupplyRequest {
  id: string;
  tenantId: string;
  requesterId: string;
  department: string;
  itemId: string;
  qty: number;
  reason: string;
  requestDate: string;
  status: 'Menunggu Approval' | 'Disetujui' | 'Didistribusikan' | 'Ditolak';
  distributedAt?: string;
}

export interface GATicket {
  id: string;
  tenantId: string;
  ticketNumber: string;
  category: 'Aset Rusak/Perawatan' | 'Pinjam Ruangan/Fasilitas' | 'Pinjam Kendaraan' | 'Minta ATK/Perlengkapan' | 'Lainnya (Umum)';
  requesterId: string;
  title: string;
  description: string;
  priority: 'Rendah' | 'Normal' | 'Tinggi' | 'Darurat';
  status: 'Terbuka' | 'Sedang Diproses' | 'Menunggu Konfirmasi' | 'Selesai' | 'Ditolak';
  assignedStaff?: string;
  slaHours: number;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

// 34. Procurement Vendor Invoices (AP)
export interface VendorInvoice {
  id: string;
  tenantId: string;
  vendorId: string;
  vendorName: string;
  poNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status: 'Belum Bill' | 'Sudah Bill';
  paidDate?: string;
  paymentMethod?: string;
  taxInvoiceNumber?: string;
  notes?: string;
}

// 35. Audit Trail Log
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  entityId?: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  module: string;
  action: string;
  recordId: string;
  changesSummary: string;
  details?: { field: string; oldValue: any; newValue: any }[];
}

// 36. eNPS Engagement Survey
export interface ENpsSurvey {
  id: string;
  tenantId: string;
  period: string;
  title: string;
  isActive: boolean;
  responses: {
    id: string;
    score: number;
    department: string;
    feedback?: string;
    submittedAt: string;
  }[];
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  score: number;
}

// 37. Universal Document & File Preview
export interface UniversalPreviewItem {
  title: string;
  documentNumber?: string;
  typeBadge?: string;
  date?: string;
  partyName?: string;
  partyRole?: string;
  statusBadge?: {
    label: string;
    variant?: 'success' | 'warning' | 'danger' | 'info';
  };
  detailsGrid?: { label: string; value: string | number }[];
  contentParagraphs?: string[];
  rawHtmlOrBody?: string;
  qrPayload?: string;
  signeeName?: string;
  signeeRole?: string;
  attachments?: { fileName: string; fileSize?: string; fileType?: string }[];
}

