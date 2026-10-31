# Database, Migration & Seed Rules — NusaHR Enterprise HRMS

Status: backend/DB belum dibangun. Begitu koneksi database nyata tersambung, tiga
aturan berikut WAJIB dipatuhi untuk setiap pekerjaan yang menyentuh skema.

## Pilihan tooling (rekomendasi, bisa diganti di awal proyek ini juga tidak mahal)

- **Driver**: `pg` (node-postgres) — ringan, cocok untuk Postgres/Supabase/Neon.
- **Migration & schema**: **Drizzle ORM + drizzle-kit**. Alasan: migration-nya berupa
  file `.sql` asli yang bisa dibaca & diaudit langsung (cocok dengan aturan #1 di
  bawah), skema didefinisikan di TypeScript (selaras dengan codebase yang 100% TS),
  dan mendukung raw SQL/CTE dengan mudah — dibutuhkan untuk query hierarki entitas
  (lihat `docs/SYSTEM_DESIGN.md` §Multi-Tenancy). Jika tim lebih nyaman dengan Prisma,
  aturan di bawah tetap berlaku sama, hanya mekanisme file migrasinya yang berbeda.

## Aturan 1 — Semua perubahan skema WAJIB lewat file migrasi

- Tidak ada perubahan tabel/kolom langsung di database manapun (termasuk di Supabase
  dashboard) tanpa file migrasi yang committed ke repo.
- Satu migrasi = satu perubahan logis, bernomor urut/timestamp
  (`drizzle/migrations/0007_add_asset_warranty_fields.sql`), tidak pernah diedit
  setelah di-apply ke environment manapun — perubahan lanjutan selalu migrasi baru.
- Setiap migrasi harus punya jalur mundur yang jelas (down migration atau catatan
  rollback manual) sebelum di-apply ke staging/production.
- Migrasi harus idempotent-safe dijalankan di environment baru dari nol (`migrate up`
  dari migration pertama harus menghasilkan skema akhir yang identik).

## Aturan 2 — Setiap modul WAJIB punya data sample (seed) untuk testing

- Setiap domain/modul (Employee, Org Structure, Approval Engine, Document, GA Asset,
  Procurement, Payroll, Loan, Leave, SPPD, Recruitment, dst) punya file seed sendiri
  di `db/seed/<module>.seed.ts`, bukan satu file raksasa — cermin dari
  `src/data/initialData.ts` yang sudah ada sekarang, tapi dipecah per domain.
- Seed harus **idempotent** (upsert berdasarkan natural key/slug, bukan INSERT buta)
  supaya aman dijalankan berulang kali di environment testing tanpa membuat duplikat.
- Seed WAJIB mencakup skenario yang menguji relasi antar modul yang pernah jadi
  temuan audit (`docs/AUDIT_FINDINGS.md`) — misalnya: minimal satu Asset dengan
  riwayat handover penuh (assigned → returned), satu Approval Request multi-level
  yang sedang berjalan di level 2, satu Document yang sudah full-signed vs satu yang
  masih menunggu TTD, satu entitas anak dengan pengaturan cuti yang berbeda dari
  induknya — bukan cuma data "happy path" datar.
- Seed berjalan via satu entrypoint (`npm run db:seed`) yang memanggil seed tiap
  modul secara berurutan sesuai dependency (Tenant → Entity → Org → Employee →
  lainnya), dan harus bisa dijalankan terpisah per modul untuk debugging
  (`npm run db:seed -- --module=assets`).

## Aturan 3 — Setiap penambahan/perubahan skema utama WAJIB update 3 hal sekaligus

Saat ada perubahan pada tabel inti (Tenant, CompanyEntity, Employee, ApprovalEngine,
OfficialDocument, Asset, dll), satu commit/PR yang sama wajib menyertakan:

1. **File migrasi** (Aturan 1) yang menerapkan perubahan ke database.
2. **File seed** (Aturan 2) yang diperbarui supaya data contoh tetap valid terhadap
   skema baru (kolom baru NOT NULL tanpa default → seed wajib diisi, bukan dibiarkan
   gagal saat dijalankan).
3. **`docs/ERD.md`** — tabel/kolom yang diubah didokumentasikan ulang di bagian yang
   relevan (gunakan §4 sebagai model target; pindahkan ke bagian utama begitu
   diimplementasikan nyata).

PR yang mengubah skema tapi tidak menyertakan ketiganya dianggap tidak lengkap.

## Larangan

- Jangan pernah membuat tabel/kolom langsung lewat GUI database provider tanpa
  migrasi yang menyusul di repo pada hari yang sama.
- Jangan menaruh kredensial database di kode atau di seed file — selalu dari env var.
- Jangan membuat migrasi yang menghapus kolom/tabel tanpa terlebih dahulu mengecek
  apakah kolom itu masih dipakai jalur lain (lihat pola orphaned type di
  `docs/AUDIT_FINDINGS.md`, misalnya `AssetRelocationLog` yang terlanjur tidak
  terpakai — jangan menambah tipe baru yang bernasib sama).
