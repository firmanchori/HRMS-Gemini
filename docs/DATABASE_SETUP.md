# Database Configuration & Environment Setup Guide
## NusaHR Enterprise HRMS

**Status:** Ready for Deployment  
**Didukung:** PostgreSQL 15+, Supabase, PlanetScale/MySQL, Docker  

---

### 1. Template File `.env.local`
Buat atau perbarui file `.env.local` pada direktori root project dengan variabel berikut:

```env
# ==============================================================================
# 1. DATABASE CONFIGURATION (PostgreSQL / Supabase / Neon / Local Docker)
# ==============================================================================

# Connection URI Standar PostgreSQL (Ganti dengan credential database Anda)
# Format: postgresql://[user]:[password]@[host]:[port]/[database_name]?sslmode=require
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/nusahr_db?sslmode=prefer"

# Opsi Direct URL untuk migration tool (Prisma / Drizzle / Flyway) jika menggunakan PgBouncer pooler
DIRECT_URL="postgresql://postgres:your_password@localhost:5432/nusahr_db?sslmode=prefer"

# Parameter Database Terpisah (Opsional jika menggunakan driver individual)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="nusahr_db"
DB_USER="postgres"
DB_PASSWORD="your_password"
DB_SSL="false"

# ==============================================================================
# 2. SUPABASE INTEGRATION (Jika menggunakan Supabase BaaS & Object Storage)
# ==============================================================================
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Storage Bucket Names
SUPABASE_BUCKET_AVATARS="employee-avatars"
SUPABASE_BUCKET_DOCUMENTS="official-documents"
SUPABASE_BUCKET_LOGOS="company-logos"

# ==============================================================================
# 3. AI & GEMINI INTEGRATION
# ==============================================================================
# API Key untuk asisten analisis HR pintar (Review KPI, ringkasan SK, dll)
GEMINI_API_KEY="your-gemini-api-key"

# ==============================================================================
# 4. APPLICATION SERVER & SECURITY
# ==============================================================================
APP_URL="http://localhost:3000"
JWT_SECRET="nusahr-enterprise-secure-jwt-secret-key-2026"
ENCRYPTION_KEY="32-char-random-aes-secret-key!"
NODE_ENV="development"
PORT="3000"
```

---

### 2. Panduan Setup Database Cepat (Quickstart)

#### Opsi A: Menjalankan PostgreSQL via Docker Container Lokal
Jika Anda memiliki Docker terpasang, jalankan perintah berikut di terminal:
```bash
docker run --name nusahr-postgres \
  -e POSTGRES_DB=nusahr_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16-alpine
```

#### Opsi B: Menggunakan Cloud PostgreSQL (Supabase / Neon / Railway)
1. Buat project baru di [supabase.com](https://supabase.com) atau [neon.tech](https://neon.tech).
2. Salin *Connection String (URI)* dari dashboard database Anda.
3. Paste ke dalam `DATABASE_URL` pada `.env.local`.

---

### 3. Eksekusi Script Inisialisasi Skema DDL
Skema SQL lengkap dengan tabel `tenants`, `employees`, `job_vacancies`, `candidates`, `onboarding_processes`, dan tabel referensi lainnya dapat dieksekusi langsung sesuai petunjuk pada [docs/ERD.md](file:///Users/anggrainidpm/CODE%20PROJECT/antigravity/hrms-gemini/docs/ERD.md).
