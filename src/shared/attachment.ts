export const MAX_ATTACHMENT_BYTES = 600 * 1024; // base64 inflates ~33%; the API body limit is 1 MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

/** Reads a proof document into a data URL after checking type and size; rejects with a user-facing message. */
export function readAttachment(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) return Promise.reject(new Error('Lampiran harus berupa gambar (PNG/JPG/WebP) atau PDF.'));
  if (file.size > MAX_ATTACHMENT_BYTES) return Promise.reject(new Error('Ukuran lampiran maksimal 600 KB.'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca berkas lampiran.'));
    reader.readAsDataURL(file);
  });
}
