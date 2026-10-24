# UI/UX Design System & Layout Guidelines
## NusaHR Enterprise HRMS

**Status:** Standard Design System 2026  
**Inspirasi:** Enterprise Modern SaaS, Slate-Indigo Palette, WCAG 2.1 AA Compliant  

---

### 1. Hierarki Navigasi & Standar Sub-Menu (Tabs)
> [!IMPORTANT]
> **Aturan Penempatan Tab & Sub-Menu:**
> Tab atau sub-menu halaman **TIDAK BOLEH** diletakkan di sebelah kanan judul halaman di dalam baris yang sama.

#### 1.1. Alasan Desain:
Ketika tab ditaruh di sebelah kanan judul halaman:
- Pada tablet (768px - 1024px), judul halaman terhimpit dan terpotong secara canggung.
- Pada mobile (< 768px), layout menjadi berantakan karena button dan tab terbungkus (*wrapped*) secara tidak teratur.
- Tombol aksi utama (CTA seperti "Tambah Karyawan" atau "Buat Lowongan") bertabrakan dengan tab.

#### 1.2. Layout Standar Header & Tab Bar Baru:
Setiap modul wajib menggunakan struktur 2 baris terpisah yang elegan:

```tsx
{/* Row 1: Judul Halaman & Tombol Aksi Utama (CTA) */}
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
  <div>
    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
      <Icon className="w-5 h-5 text-indigo-600" />
      <span>Judul Modul</span>
    </h2>
    <p className="text-xs text-slate-500">Penjelasan fungsi modul dan regulasi terkait.</p>
  </div>
  <div className="flex items-center gap-2">
    <button className="cta-button">Aksi Utama (+ Tambah Data)</button>
  </div>
</div>

{/* Row 2: Sub-Menu Navigasi Mandiri (Scrollable Horizontal) */}
<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 border-b border-slate-200">
  <button className="tab-pill">Tab 1</button>
  <button className="tab-pill">Tab 2</button>
  <button className="tab-pill">Tab 3</button>
</div>
```

---

### 2. Standar Interaksi Modal Dialog (Backdrop Dismiss)
> [!IMPORTANT]
> **Aturan Menutup Modal (Dismissal Rule):**
> Seluruh modal dialog wajib dapat ditutup saat pengguna mengklik area luar modal (backdrop gelap).

```tsx
<div 
  className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
  onClick={(e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }}
>
  <div 
    className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Konten Modal */}
  </div>
</div>
```

---

### 3. Responsivitas Tablet (768px - 1024px) & Top Bar Menu
1. **Header Top Bar:**
   - Gunakan badge ringkas dan icon tooltip untuk aksi sekunder.
   - Kolom pencarian global memiliki lebar adaptif (`w-36 md:w-52 lg:w-72`).
   - Tenant & Entity selector tidak memicu horizontal scrolling.
2. **Kartu & Tabel di Tablet:**
   - Gunakan `overflow-x-auto` pada seluruh tabel data.
   - Grid statistik menggunakan `grid-cols-2 md:grid-cols-3 xl:grid-cols-6`.
