import { eq, and } from "drizzle-orm";
import { db } from "../client.ts";
import {
  tenants,
  companyEntities,
  companyDivisions,
  companyDepartments,
  masterJobPositions,
  educationLevels,
  fieldsOfStudy,
  employees,
  jobRequisitions,
  documentSignatoryConfigs,
  jobVacancies,
  candidates,
  onboardingProcesses,
  competencyTestTypeSettings,
  interviewTypeSettings,
  onboardingChecklistTemplates,
  users,
} from "../schema.ts";

/** Minimum standard set the user asked for ("Tingkat/Strata Pendidikan ... minimalnya"). */
const EDUCATION_LEVEL_NAMES = ["SD", "SMP", "SMA/SMK", "D1", "D2", "D3", "D4", "S1", "S2", "S3"];

/** A representative starter catalog — tenants can add more via the master-data admin UI. */
const FIELD_OF_STUDY_SEED: { name: string; category: string }[] = [
  { name: "Teknik Informatika", category: "Teknik" },
  { name: "Sistem Informasi", category: "Teknik" },
  { name: "Teknik Industri", category: "Teknik" },
  { name: "Teknik Elektro", category: "Teknik" },
  { name: "Manajemen", category: "Ekonomi & Bisnis" },
  { name: "Akuntansi", category: "Ekonomi & Bisnis" },
  { name: "Ekonomi Pembangunan", category: "Ekonomi & Bisnis" },
  { name: "Hukum", category: "Sosial Humaniora" },
  { name: "Psikologi", category: "Sosial Humaniora" },
  { name: "Ilmu Komunikasi", category: "Sosial Humaniora" },
  { name: "Administrasi Bisnis", category: "Ekonomi & Bisnis" },
  { name: "Sastra Inggris", category: "Sosial Humaniora" },
];

const FPTK_SIGNATORY_SEED = [
  { roleLabel: "HR Manager", isRequired: true, sortOrder: 1 },
  { roleLabel: "Direktur/Kepala Entitas", isRequired: true, sortOrder: 2 },
  { roleLabel: "Direktur Keuangan", isRequired: false, sortOrder: 3 },
];

/** Default onboarding checklist — mirrors src/data/initialData.ts DEFAULT_ONBOARDING_CHECKLIST_TEMPLATES (kept as a plain literal here since server seeds can't import frontend modules). */
const ONBOARDING_CHECKLIST_TEMPLATE_SEED = [
  {
    title: "Pemeriksaan Dokumen",
    category: "Legalitas & Dokumen",
    targetDepartment: "HR",
    verificationType: "manual",
    isMandatory: true,
    description: "Pemeriksaan dan verifikasi kelengkapan berkas fisik & digital dokumen persyaratan karyawan.",
    subItems: [
      "KTP Elektronik Asli / Salinan Terverifikasi",
      "Kartu NPWP Terverifikasi DJP",
      "Kartu Keluarga (KK) Terbaru",
      "Ijazah Asli & Transkrip Nilai Akademik",
      "Buku Rekening Bank untuk Payroll Gaji",
      "Surat Keterangan Catatan Kepolisian (SKCK)",
      "Surat Keterangan Sehat / Hasil Medical Check-Up (MCU)",
    ],
  },
  {
    title: "Kelengkapan Data Di System",
    category: "Legalitas & Dokumen",
    targetDepartment: "HR",
    verificationType: "manual",
    isMandatory: true,
    description: "Perekaman dan validasi data profil karyawan ke dalam database Sistem Informasi SDM NusaHR.",
    subItems: [
      "Input NIK KTP 16-Digit & Nomor Kartu Keluarga ke Sistem",
      "Pendaftaran Nomor NPWP & Status PTKP TER Pajak",
      "Pendaftaran Nomor Kepesertaan BPJS Ketenagakerjaan (KPJ)",
      "Pendaftaran Nomor Kartu BPJS Kesehatan",
      "Input Nomor Rekening Bank Payroll & Nama Pemilik Rekening",
      "Input Kontak Darurat (Nama, Nomor Telepon & Hubungan Keluarga)",
      "Alamat Domisili Karyawan & Nomor Kontak WhatsApp Aktif",
    ],
  },
  {
    title: "Tanda Tangan Kontrak Digital QR (PKWT/PKWTT) & NDA",
    category: "Legalitas & Dokumen",
    targetDepartment: "HR",
    verificationType: "manual",
    isMandatory: true,
    description: "Penandatanganan digital kontrak kerja resmi dan Non-Disclosure Agreement (NDA).",
    subItems: [
      "Review Draf Surat Perjanjian Kerja Waktu Tertentu/Tidak Tertentu",
      "Penandatanganan Digital Dokumen Kontrak via QR Code Validasi",
      "Penandatanganan Non-Disclosure Agreement (NDA)",
      "Penandatanganan Pakta Integritas & Kode Etik Perusahaan",
      "Pengarsipan Salinan Dokumen Kontrak Kerja Karyawan",
    ],
  },
  {
    title: "Pengajuan ID Card & Akses Fasilitas",
    category: "Fasilitas & GA",
    targetDepartment: "GA",
    verificationType: "manual",
    isMandatory: true,
    description: "Pembuatan ID Card resmi dan aktivasi hak akses gedung kantor oleh General Affairs (GA).",
    subItems: [
      "Pengambilan / Upload Pas Foto Formal untuk ID Card",
      "Pencetakan Kartu ID Card Fisik & Lanyard",
      "Aktivasi Sensor RFID Turnstile Gate Lobby Gedung",
      "Registrasi Hak Akses Pintu Ruang Kerja Departemen",
      "Penyerahan Fisik ID Card & Tanda Terima Fasilitas ke Karyawan",
    ],
  },
  {
    title: "Pengajuan/Permintaan Perangkat",
    category: "Inventaris & IT",
    targetDepartment: "IT",
    verificationType: "manual",
    isMandatory: true,
    description: "Penyediaan unit laptop kerja dan kelengkapan perangkat penunjang oleh IT Support.",
    subItems: [
      "Penyiapan Unit Laptop Kerja Sesuai Standar Formasi Jabatan",
      "Pemasangan Stiker Label Aset (IT Asset Tag & Barcode)",
      "Penyiapan Kelengkapan (Charger Adaptor, Mouse & Tas Laptop)",
      "Pemeriksaan Kelayakan Fisik & Uji Performa Perangkat",
      "Penandatanganan Berita Acara Serah Terima (BAST) Perangkat",
    ],
  },
  {
    title: "Penyediaan Akun-Akun Sistem & Email Korporat",
    category: "Inventaris & IT",
    targetDepartment: "IT",
    verificationType: "manual",
    isMandatory: true,
    description: "Penerbitan akun email perusahaan dan hak akses sistem kerja oleh IT Support.",
    subItems: [
      "Pembuatan Akun Email Korporat Resmi",
      "Pembuatan Akun NusaHR Employee Portal & Absensi Mobile",
      "Provisioning Akses Workspace Komunikasi (Slack / Discord / Teams)",
      "Pemberian Hak Akses Sistem Kerja Departemen (Jira, GitHub, ERP, dsb.)",
      "Pengiriman Kredensial & Panduan Setup Password Pertama Kali",
    ],
  },
  {
    title: "Orientasi Budaya Perusahaan & Office Tour",
    category: "Pengenalan & HR",
    targetDepartment: "HR",
    verificationType: "manual",
    isMandatory: false,
    description: "Sesi perkenalan nilai-nilai perusahaan, tur kantor, dan penunjukan buddy kerja.",
    subItems: [
      "Office Tour & Pengenalan Denah Fasilitas Gedung Kantor",
      "Perkenalan dengan Rekan Tim Kerja, Manager & Head of Dept",
      "Penjelasan Jam Kerja, Presensi Mobile & Peraturan Perusahaan",
      "Sosialisasi Benefit Karyawan, Asuransi & Kebijakan HR",
      "Penunjukan Mentor / Buddy Kerja Selama Masa Orientasi",
    ],
  },
];

/** A reasonable starter catalog of assessment/interview types — tenants edit or add their own via the Recruitment settings UI. */
const COMPETENCY_TEST_TYPE_SEED = [
  { name: "Tes Teknis / Coding & Arsitektur", category: "Hard Skill", passingGrade: 75, durationMinutes: 90, method: "Live Coding", description: "Evaluasi algoritma, arsitektur kode, dan problem solving.", weightPercent: 35 },
  { name: "Psikotes (DISC / MBTI / Karakter)", category: "Soft Skill", passingGrade: 70, durationMinutes: 60, method: "Online Test", description: "Analisis profil kepribadian kerja dan stabilitas emosi.", weightPercent: 20 },
  { name: "Tes Logika & Numerik (GMA / TPA)", category: "Kognitif & Logika", passingGrade: 75, durationMinutes: 45, method: "Online Test", description: "Uji penalaran logis abstrak dan analisis data numerik.", weightPercent: 15 },
  { name: "Kemahiran Bahasa Inggris Bisnis", category: "Bahasa", passingGrade: 70, durationMinutes: 60, method: "Online Test", description: "Pengujian listening, reading, dan korespondensi profesional.", weightPercent: 15 },
  { name: "Case Study & Presentasi Bisnis", category: "Studi Kasus", passingGrade: 80, durationMinutes: 120, method: "Presentasi", description: "Simulasi penyelesaian masalah riil dan presentasi dewan penguji.", weightPercent: 15 },
];

const INTERVIEW_TYPE_SEED = [
  {
    name: "Wawancara Teknis & User (Technical Deep-Dive)",
    targetRole: "Engineering & Product Teams",
    description: "Evaluasi kompetensi keahlian teknis, arsitektur sistem, dan problem solving.",
    interviewerRoles: "Tech Lead / Principal Engineer / User Manager",
    criteria: [
      { id: "crit-tech-1", name: "Arsitektur Sistem & Perancangan Solusi", weightPercent: 30 },
      { id: "crit-tech-2", name: "Problem Solving & Analisis Akar Masalah (RCA)", weightPercent: 30 },
      { id: "crit-tech-3", name: "Kualitas Kode, Testing & Security Standards", weightPercent: 20 },
    ],
  },
  {
    name: "Wawancara HR & Culture Fit",
    targetRole: "Semua Posisi",
    description: "Evaluasi kesesuaian nilai, motivasi, dan budaya kerja kandidat.",
    interviewerRoles: "HR Manager / HR Business Partner",
    criteria: [
      { id: "crit-hr-1", name: "Motivasi & Kesesuaian Nilai Perusahaan", weightPercent: 50 },
      { id: "crit-hr-2", name: "Komunikasi & Kolaborasi Tim", weightPercent: 50 },
    ],
  },
];

/** Master data every tenant needs, plus the default signatory config for FPTK — seeded once per tenant, never a hardcoded frontend list. */
export async function seedRecruitmentMasterData() {
  const allTenants = await db.select().from(tenants);
  for (const tenant of allTenants) {
    const [existingLevel] = await db.select().from(educationLevels).where(eq(educationLevels.tenantId, tenant.id)).limit(1);
    if (!existingLevel) {
      await db.insert(educationLevels).values(
        EDUCATION_LEVEL_NAMES.map((name, idx) => ({ tenantId: tenant.id, name, sortOrder: idx }))
      );
    }

    const [existingField] = await db.select().from(fieldsOfStudy).where(eq(fieldsOfStudy.tenantId, tenant.id)).limit(1);
    if (!existingField) {
      await db.insert(fieldsOfStudy).values(FIELD_OF_STUDY_SEED.map((f) => ({ tenantId: tenant.id, ...f })));
    }

    const [existingSignatory] = await db
      .select()
      .from(documentSignatoryConfigs)
      .where(and(eq(documentSignatoryConfigs.tenantId, tenant.id), eq(documentSignatoryConfigs.documentType, "FPTK")))
      .limit(1);
    if (!existingSignatory) {
      await db.insert(documentSignatoryConfigs).values(FPTK_SIGNATORY_SEED.map((s) => ({ tenantId: tenant.id, documentType: "FPTK", ...s })));
    }

    const [existingTestType] = await db.select().from(competencyTestTypeSettings).where(eq(competencyTestTypeSettings.tenantId, tenant.id)).limit(1);
    if (!existingTestType) {
      await db.insert(competencyTestTypeSettings).values(COMPETENCY_TEST_TYPE_SEED.map((t) => ({ tenantId: tenant.id, ...t })));
    }

    const [existingInterviewType] = await db.select().from(interviewTypeSettings).where(eq(interviewTypeSettings.tenantId, tenant.id)).limit(1);
    if (!existingInterviewType) {
      await db.insert(interviewTypeSettings).values(INTERVIEW_TYPE_SEED.map((t) => ({ tenantId: tenant.id, ...t })));
    }

    const [existingChecklistTemplate] = await db.select().from(onboardingChecklistTemplates).where(eq(onboardingChecklistTemplates.tenantId, tenant.id)).limit(1);
    if (!existingChecklistTemplate) {
      await db.insert(onboardingChecklistTemplates).values(ONBOARDING_CHECKLIST_TEMPLATE_SEED.map((t) => ({ tenantId: tenant.id, ...t })));
    }
  }
  console.log(`Master data pendidikan/jurusan, konfigurasi penandatangan FPTK, jenis tes, interview & template onboarding disiapkan untuk ${allTenants.length} tenant.`);
}

/** Sample employees + one FPTK for the "contoh" demo tenant (PT Contoh) — real seeded rows, not frontend mock arrays. */
export async function seedRecruitmentSamplesForContoh() {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, "contoh")).limit(1);
  if (!tenant) return console.log("Tenant 'contoh' belum ada, skip contoh data rekrutmen.");

  const [holding] = await db.select().from(companyEntities).where(and(eq(companyEntities.tenantId, tenant.id), eq(companyEntities.code, "HOLD"))).limit(1);
  if (!holding) return console.log("Entitas holding 'contoh' belum ada, skip contoh data rekrutmen.");

  const [existingEmployee] = await db.select().from(employees).where(eq(employees.tenantId, tenant.id)).limit(1);
  if (existingEmployee) return console.log("Contoh data karyawan/FPTK untuk tenant 'contoh' sudah ada, skip.");

  const [hrDivision] = await db.select().from(companyDivisions).where(and(eq(companyDivisions.tenantId, tenant.id), eq(companyDivisions.code, "HR"))).limit(1);
  const [recruitDept] = await db.select().from(companyDepartments).where(and(eq(companyDepartments.tenantId, tenant.id), eq(companyDepartments.code, "RECRUIT"))).limit(1);
  const [hrmPosition] = await db.select().from(masterJobPositions).where(and(eq(masterJobPositions.tenantId, tenant.id), eq(masterJobPositions.code, "HRM"))).limit(1);
  const [hrsPosition] = await db.select().from(masterJobPositions).where(and(eq(masterJobPositions.tenantId, tenant.id), eq(masterJobPositions.code, "HRS"))).limit(1);

  const seededEmployees = await db
    .insert(employees)
    .values([
      {
        tenantId: tenant.id,
        entityId: holding.id,
        nik: "202601.0001",
        fullName: "Siti Rahma",
        email: "siti.rahma@contoh.local",
        positionId: hrmPosition?.id,
        divisionId: hrDivision?.id,
        departmentId: recruitDept?.id,
        status: "Aktif",
        joinDate: new Date("2023-02-01"),
      },
      {
        tenantId: tenant.id,
        entityId: holding.id,
        nik: "202401.0002",
        fullName: "Budi Santoso",
        email: "budi.santoso@contoh.local",
        positionId: hrsPosition?.id,
        divisionId: hrDivision?.id,
        departmentId: recruitDept?.id,
        status: "Resign",
        joinDate: new Date("2022-05-01"),
        resignDate: new Date("2026-09-15"),
        resignReason: "Mengundurkan diri — melanjutkan studi",
      },
      {
        tenantId: tenant.id,
        entityId: holding.id,
        nik: "202401.0003",
        fullName: "Dewi Kartika",
        email: "dewi.kartika@contoh.local",
        positionId: hrsPosition?.id,
        divisionId: hrDivision?.id,
        departmentId: recruitDept?.id,
        status: "PHK",
        joinDate: new Date("2021-08-01"),
        resignDate: new Date("2026-06-30"),
        resignReason: "Pemutusan hubungan kerja — restrukturisasi",
      },
    ])
    .returning();

  const replacementCandidate = seededEmployees.find((e) => e.fullName === "Budi Santoso")!;

  const [levelS1] = await db.select().from(educationLevels).where(and(eq(educationLevels.tenantId, tenant.id), eq(educationLevels.name, "S1"))).limit(1);
  const studyFields = await db.select().from(fieldsOfStudy).where(and(eq(fieldsOfStudy.tenantId, tenant.id))).limit(2);
  const [adminUser] = await db.select().from(users).where(and(eq(users.tenantId, tenant.id), eq(users.role, "tenant_admin"))).limit(1);

  if (adminUser) {
    await db.insert(jobRequisitions).values({
      tenantId: tenant.id,
      entityId: holding.id,
      divisionId: hrDivision?.id,
      departmentId: recruitDept?.id,
      positionId: hrsPosition?.id,
      requestedByUserId: adminUser.id,
      requisitionType: "Penggantian",
      replacementEmployeeId: replacementCandidate.id,
      headcount: 1,
      educationLevelId: levelS1?.id,
      fieldsOfStudyIds: studyFields.map((f) => f.id),
      minExperienceYears: 1,
      knockoutCriteria: [{ category: "Pendidikan", label: "Minimal S1 segala jurusan", matchMode: "contains" }],
      scoredCriteria: [{ label: "Pengalaman rekrutmen", weight: 40 }, { label: "Kemampuan komunikasi", weight: 30 }],
      status: "Menunggu Approval",
      details: {
        reqNumber: `FPTK/HR-RECRUIT/${tenant.subdomain.toUpperCase()}/XI/2026`,
        position: "HR Staff",
        department: "Human Resources",
        grade: "Grade 4 s/d Grade 5",
        gradeMin: "Grade 4 - Senior Staff",
        gradeMax: "Grade 5 - Staff",
        targetJoinDate: "2026-12-01",
        requesterName: adminUser.name,
        requesterTitle: "HR Manager",
        requirements: "Minimal S1 segala jurusan, pengalaman 1 tahun di bidang rekrutmen.",
      },
    });
  }

  const [vacancy] = await db
    .insert(jobVacancies)
    .values({
      tenantId: tenant.id,
      entityId: holding.id,
      title: "HR Staff - Recruitment",
      openings: 1,
      status: "Buka",
      details: {
        department: "Human Resources",
        employmentType: "Kontrak",
        grade: "Grade 4 s/d Grade 5",
        minExperience: "Minimal 1 Tahun",
        salaryRange: "Gaji Kompetitif (Confidential)",
        rawInternalSalary: "Rp 6.000.000 - Rp 7.500.000",
        requirements: "Minimal S1 segala jurusan, pengalaman 1 tahun di bidang rekrutmen.",
        description: "Bertanggung jawab atas proses rekrutmen end-to-end, mulai dari sourcing hingga onboarding.",
      },
    })
    .returning();

  const [candidate] = await db
    .insert(candidates)
    .values({
      tenantId: tenant.id,
      jobVacancyId: vacancy.id,
      name: "Rizky Febrian",
      email: "rizky.febrian@contoh-pelamar.local",
      phone: "081234567890",
      stage: "Screening",
      aiMatchScore: 78,
      details: {
        lastCompany: "PT Mitra Solusindo",
        expectedSalary: 7000000,
        sourcePortal: "LinkedIn",
        resumeParsed: true,
        cvFileName: "CV_Rizky_Febrian.pdf",
      },
    })
    .returning();

  await db.insert(onboardingProcesses).values({
    tenantId: tenant.id,
    entityId: holding.id,
    type: "via_recruitment",
    candidateId: candidate.id,
    employeeName: "Dewi Anggraini",
    email: "dewi.anggraini@contoh-pelamar.local",
    phone: "081298765432",
    position: "HR Staff",
    joinDate: new Date("2026-11-15"),
    basicSalary: 6500000,
    contractDocNumber: `001/HRD-PKWT/${tenant.subdomain.toUpperCase()}/XI/2026`,
    status: "In Progress",
    tasks: [
      { id: "t1", title: "Kontrak Kerja (PKWT) Ditandatangani", category: "Legalitas & Dokumen", isCompleted: true, isMandatory: true, assignedRole: "hr_admin" },
      { id: "t2", title: "Pembuatan Email & Akun Sistem", category: "IT Provisioning", isCompleted: false, isMandatory: true, assignedRole: "it_admin" },
      { id: "t3", title: "Kartu Akses & ID Card", category: "GA", isCompleted: false, isMandatory: false, assignedRole: "ga_admin" },
    ],
    details: {
      department: "Human Resources",
      employmentType: "Kontrak",
    },
  });

  console.log(`Contoh data karyawan, FPTK, lowongan, kandidat & onboarding untuk tenant 'contoh' dibuat (${seededEmployees.length} karyawan).`);
}
