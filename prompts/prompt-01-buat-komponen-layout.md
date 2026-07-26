# Prompt 01 — Buat Komponen Layout Website

## Konteks

Ini adalah aplikasi **BLP Harian** — pencatatan amaliyah harian siswa SMP TISA Islamic School.
Stack: React 19 + Vite + Tailwind CSS 4 + Express + TypeScript.

Saat ini tampilan app masih berbentuk **dashboard app** (header tertanam di dalam masing-masing
komponen, tidak ada footer, tidak ada struktur website yang konsisten).

Tujuan prompt ini: **buat komponen layout baru** (`SiteHeader`, `SiteFooter`, `PageLayout`)
tanpa mengubah `SiswaDashboard.tsx` atau `GuruDashboard.tsx` dulu — itu dikerjakan di Prompt 02.

---

## Yang Harus Dibuat

### 1. `src/components/layout/SiteHeader.tsx`

Header website yang **persistent** dan **bisa dikonfigurasi** lewat props. Desain:

- **Kiri:** Logo (`/logo.png`, tinggi 32px) + teks "BLP Harian" (bold) + "SMP TISA Islamic School"
  (kecil, redup)
- **Tengah (opsional):** Slot `navItems` — jika diberikan, tampilkan sebagai tab navigasi
  horizontal (desktop) atau baris tab (mobile). Setiap item: `{ label, icon?, onClick,
  isActive }`.
- **Kanan:** Slot `actions` — jika diberikan, tampilkan tombol-tombol (logout, dark mode, dll).
  Jika tidak diberikan, kanan kosong.
- Background: `bg-emerald-700 dark:bg-emerald-900 text-white`
- Sticky top-0, z-10, shadow-lg
- Fully responsive (mobile: logo + hamburger atau nav di bawah header jika ada navItems)

Props interface:
```ts
interface NavItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
}

interface SiteHeaderProps {
  navItems?: NavItem[];
  actions?: React.ReactNode;
}
```

### 2. `src/components/layout/SiteFooter.tsx`

Footer sederhana. Desain:
- Background: `bg-slate-800 dark:bg-slate-950 text-slate-400`
- Konten tengah: "© 2025 BLP Harian · SMP TISA Islamic School"
- Padding `py-4`, teks `text-xs text-center`
- Tidak perlu link atau kolom-kolom, cukup satu baris

### 3. `src/components/layout/PageLayout.tsx`

Wrapper layout standar. Desain:
```tsx
// Struktur:
// <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
//   <SiteHeader navItems={navItems} actions={actions} />
//   <main className="flex-1 w-full">
//     {children}
//   </main>
//   <SiteFooter />
// </div>
```

Props:
```ts
interface PageLayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];      // diteruskan ke SiteHeader
  actions?: React.ReactNode; // diteruskan ke SiteHeader
}
```

Export `NavItem` type dari `PageLayout.tsx` supaya bisa dipakai di komponen lain.

---

## Yang Harus Dimodifikasi

### 4. `src/components/Login.tsx`

Saat ini `Login.tsx` punya header sendiri (logo, judul, dll di bagian atas card login).
**Bungkus seluruh return-nya** dengan `PageLayout` (tanpa `navItems` dan tanpa `actions`
karena belum login).

Pastikan tampilan halaman login tetap rapi — card login harus tetap terpusat di layar.
Tambahkan `flex items-center justify-center min-h-[calc(100vh-theme(spacing.16))]` atau
sejenisnya di `<main>` jika diperlukan agar card tetap vertikal-center.

> **Jangan ubah** logika login, form, atau API call di `Login.tsx`. Hanya wrap tampilan.

---

## Yang TIDAK Boleh Diubah di Prompt Ini

- `src/App.tsx` — jangan diubah
- `src/components/SiswaDashboard.tsx` — jangan diubah
- `src/components/GuruDashboard.tsx` — jangan diubah
- Semua file di `src/components/modals/` — jangan diubah
- Semua file di `src/utils/` dan `src/data/` — jangan diubah
- `server/` — jangan diubah

---

## Kriteria Selesai

1. File-file baru terbuat:
   - `src/components/layout/SiteHeader.tsx`
   - `src/components/layout/SiteFooter.tsx`
   - `src/components/layout/PageLayout.tsx`

2. `src/components/Login.tsx` menggunakan `PageLayout`.

3. Halaman login di browser menampilkan:
   - Header hijau emerald di atas (logo + nama sekolah)
   - Card login di tengah
   - Footer slate di bawah

4. Ambil screenshot halaman login untuk memverifikasi tampilan.

5. App masih bisa dijalankan tanpa error (workflow `npm run dev` tetap jalan normal,
   tidak ada TypeScript error).

6. Fungsionalitas login **tidak berubah** — form masih bisa kirim request ke `/api/login/siswa`
   dan `/api/login/guru`.
