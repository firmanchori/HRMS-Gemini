/**
 * WhatsApp Helper for NusaHR Enterprise
 * Direct redirection to https://wa.me/{phone}?text={encodedMessage}
 */

export interface WhatsAppNotificationPayload {
  phoneNumber: string; // e.g. "08123456789" or "628123456789"
  message: string;
}

/**
 * Normalizes Indonesian phone numbers into international WhatsApp standard (e.g. 62812xxxx)
 */
export function formatIndonesianWhatsAppNumber(phone: string): string {
  // Strip all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62') && cleaned.length > 8) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
}

/**
 * Generates the direct WhatsApp redirection link
 */
export function getWhatsAppRedirectUrl(phoneNumber: string, message: string): string {
  const cleanPhone = formatIndonesianWhatsAppNumber(phoneNumber);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Opens WhatsApp directly in a new tab or launches the WhatsApp app on mobile/desktop
 */
export function openWhatsAppChat(phoneNumber: string, message: string): void {
  const url = getWhatsAppRedirectUrl(phoneNumber, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Pre-built template generators for common HR notifications
 */
export const WhatsAppTemplates = {
  payslip: (params: {
    employeeName: string;
    nik: string;
    companyName: string;
    period: string;
    thpAmount: string;
    pph21Amount: string;
    basicSalary: string;
  }) => {
    return `*SLIP GAJI ELEKTRONIK - ${params.companyName.toUpperCase()}*

Yth. *${params.employeeName}* (NIK: ${params.nik}),
Slip gaji Anda untuk periode *${params.period}* telah resmi diterbitkan oleh Tim Payroll.

📋 *Rincian Singkat:*
• Gaji Pokok: ${params.basicSalary}
• Potongan PPh 21 TER: -${params.pph21Amount}
---------------------------------------------
💰 *TOTAL TAKE HOME PAY (THP):* *${params.thpAmount}*
---------------------------------------------

Silakan login ke portal ESS NusaHR untuk mengunduh slip PDF resmi ber-QR Code legalitas.
Terima kasih atas dedikasi dan kerja keras Anda!

_Pesan otomatis NusaHR Enterprise Portal._`;
  },

  approvalReminder: (params: {
    approverName: string;
    requesterName: string;
    category: string;
    requestId: string;
    date: string;
  }) => {
    return `*NOTIFIKASI PERSETUJUAN (APPROVAL REMINDER)*
*NusaHR Enterprise System*

Yth. *${params.approverName}*,
Terdapat permohonan yang membutuhkan persetujuan (*approval*) Anda:

📌 *Detail Pengajuan:*
• Jenis Permohonan: *${params.category}*
• ID Pengajuan: *${params.requestId}*
• Diajukan Oleh: *${params.requesterName}*
• Tanggal Pengajuan: *${params.date}*

Mohon segera membuka menu *Pusat Approval* di aplikasi NusaHR untuk melakukan peninjauan (Setujui / Tolak).
Terima kasih.`;
  },

  disciplinaryWarning: (params: {
    employeeName: string;
    nik: string;
    level: string;
    letterNumber: string;
    reason: string;
  }) => {
    return `*PEMBERITAHUAN RESMI TINDAKAN DISIPLIN*
*DIVISI HUMAN CAPITAL & COMPLIANCE*

Kepada Yth. *${params.employeeName}* (NIK: ${params.nik}),
Dengan ini disampaikan bahwa Perusahaan telah menerbitkan surat tindakan kepatuhan:

⚠️ *Tingkat Sanksi:* *${params.level}*
📄 *Nomor Surat:* ${params.letterNumber}
📝 *Perihal:* ${params.reason}

Surat resmi bertanda tangan digital QR Code telah diunggah ke arsip dossier kepegawaian Anda di portal NusaHR. Anda dapat menghubungi tim HR untuk konsultasi bipartit.`;
  },

  offeringLetter: (params: {
    candidateName: string;
    position: string;
    department: string;
    companyName: string;
    offeredSalary: string;
    joinDate: string;
  }) => {
    return `*SELAMAT! PENAWARAN KERJA RESMI (OFFERING LETTER)*
*${params.companyName.toUpperCase()}*

Halo *${params.candidateName}*,
Kami dengan bangga menyampaikan bahwa Anda telah dinyatakan lolos seluruh tahapan seleksi rekrutmen kami dan ditawarkan posisi:

💼 *Posisi:* *${params.position}* (${params.department})
💵 *Kompensasi Disepakati:* *${params.offeredSalary}* / bulan
📅 *Tanggal Mulai Masuk:* *${params.joinDate}*

Silakan balas pesan ini atau konfirmasi penerimaan surat penawaran resmi melalui tautan portal rekrutmen NusaHR.
Selamat bergabung bersama keluarga besar kami!`;
  },

  attendanceCorrection: (params: {
    employeeName: string;
    date: string;
    type: string;
    status: string;
  }) => {
    return `*UPDATE STATUS KOREKSI PRESENSI KERJA*
*NusaHR Enterprise*

Halo *${params.employeeName}*,
Pengajuan koreksi presensi kerja Anda telah diproses:

📅 *Tanggal Presensi:* ${params.date}
📌 *Jenis Koreksi:* ${params.type}
⚖️ *Status Akhir:* *${params.status.toUpperCase()}*

Rincian pencatatan jam kerja telah diperbarui pada ledger absensi & perhitungan payroll periode ini.`;
  },
};
