# Prompt 02 — Integrasi Layout ke Dashboard Siswa & Guru

## Prasyarat

**Prompt 01 harus sudah selesai dikerjakan** sebelum memulai prompt ini.
File-file berikut harus sudah ada:
- `src/components/layout/SiteHeader.tsx`
- `src/components/layout/SiteFooter.tsx`
- `src/components/layout/PageLayout.tsx` (mengekspor juga tipe `NavItem`)
- `src/components/Login.tsx` sudah menggunakan `PageLayout`

---

## Tujuan Prompt Ini

Refactor `SiswaDashboard.tsx` dan `GuruDashboard.tsx` agar menggunakan `PageLayout`
yang dibuat di Prompt 01 — sehingga keduanya punya header & footer website yang konsisten.

**Semua fungsionalitas harus tetap identik.** Hanya struktur layout yang berubah.

---

## Bagian 1 — Refactor `SiswaDashboard.tsx`

### Kondisi saat ini (yang harus dihapus / dipindahkan):

1. **Inline `<header>`** di baris ~216–259:
   ```tsx
   <header className="bg-emerald-700 dark:bg-emerald-900 ...">
     ...logo, nama siswa, dark mode toggle, tombol logout...
   </header>
   ```
   → **Hapus seluruh blok ini.**

2. **Fixed bottom `<nav>`** di baris ~578–611:
   ```tsx
   <nav className="fixed bottom-0 left-0 right-0 ...">
     ...tombol Harian, Kalender, Pengaturan...
   </nav>
   ```
   → **Hapus seluruh blok ini.**

3. **`pb-20`** pada className wrapper terluar (padding bawah untuk bottom nav):
   → Hapus `pb-20`, ganti dengan `pb-6` atau sesuaikan.

### Yang harus ditambahkan:

Bungkus seluruh return SiswaDashboard dengan `PageLayout`. Kirim props berikut ke PageLayout:

**`navItems`** — 3 tab navigasi (gantikan bottom nav yang lama):
```ts
[
  { label: 'Harian',     icon: <LayoutDashboard size={16} />, onClick: () => setView('daily'),    isActive: view === 'daily' },
  { label: 'Kalender',   icon: <CalendarIcon size={16} />,   onClick: () => setView('monthly'),  isActive: view === 'monthly' },
  { label: 'Pengaturan', icon: <Settings size={16} />,       onClick: () => setView('settings'), isActive: view === 'settings' },
]
```

**`actions`** — tombol dark mode + logout (gantikan yang ada di header lama):
```tsx
<>
  <button
    onClick={() => setDarkMode(!darkMode)}
    className="p-2 hover:bg-emerald-600 dark:hover:bg-emerald-800 rounded-full transition-colors"
    title={darkMode ? "Mode Terang" : "Mode Gelap"}
  >
    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
  </button>
  <button
    onClick={onLogout}
    className="p-2 hover:bg-emerald-600 dark:hover:bg-emerald-800 rounded-full transition-colors"
    title="Keluar"
  >
    <LogOut size={20} />
  </button>
</>
```

### Catatan penting SiswaDashboard:
- Tombol **"Edit Profil"** (avatar siswa) yang sebelumnya ada di header lama —
  pindahkan ke dalam konten halaman (misalnya di atas date selector, atau di bagian
  atas view 'settings'), bukan di header.
- Pastikan `ProfileModal` masih bisa dibuka (`showProfileModal` state tetap ada).
- State `view`, `selectedDate`, semua handler — **tidak boleh berubah sama sekali**.
- Semua modal (`QuranReadingModal`, `TextSubmissionModal`, `ChecklistSubmissionModal`,
  `ProfileModal`) harus tetap render di tempat yang sama.

---

## Bagian 2 — Refactor `GuruDashboard.tsx`

### Kondisi saat ini (yang harus dihapus / dipindahkan):

1. **Fungsi `renderHeader(title, subtitle)`** (baris ~86–125) yang merender `<header>` inline
   berbeda-beda tergantung view:
   → **Hapus fungsi `renderHeader` seluruhnya.**

2. Semua pemanggilan `{renderHeader(...)}` di dalam masing-masing view return:
   - `{renderHeader("Dashboard Guru", "Daftar Siswa BLP Harian")}` (view list)
   - `{renderHeader("Rekap Nilai Bulanan", "Rata-rata Nilai BLP Siswa")}` (view recap)
   - `{renderHeader(\`Detail Siswa: ${selectedStudent.name}\`, "Koreksi & Penilaian BLP")}` (view detail)
   → **Hapus semua pemanggilan ini.**

3. **`pb-20`** pada wrapper terluar di setiap view return (jika ada):
   → Hapus, ganti `pb-6`.

### Yang harus ditambahkan:

GuruDashboard punya beberapa view berbeda yang masing-masing merender wrapper
`<div className="min-h-screen ...">` sendiri-sendiri. Refactor menjadi **satu `PageLayout`**
yang membungkus keseluruhan komponen (bukan per-view).

Caranya: alih-alih setiap view return elemen terluar sendiri, buat **satu return tunggal**
di bawah yang merender konten sesuai `view` state:

```tsx
return (
  <PageLayout navItems={navItems} actions={actions}>
    <div className="max-w-4xl mx-auto p-4 mt-4 space-y-6">
      {view === 'list' && <...konten list...>}
      {view === 'recap' && <...konten recap...>}
      {view === 'detail' && <...konten detail...>}
      {view === 'presentation' && <...konten presentation...>}
    </div>
    {/* semua modal tetap di sini */}
  </PageLayout>
);
```

**`navItems`** untuk guru — 2 tab:
```ts
[
  { label: 'Daftar Siswa', icon: <Users size={16} />,      onClick: () => setView('list'),  isActive: view === 'list' || view === 'detail' || view === 'presentation' },
  { label: 'Rekap Nilai',  icon: <Calculator size={16} />, onClick: () => setView('recap'), isActive: view === 'recap' },
]
```

**`actions`** untuk guru — tombol profil + logout:
```tsx
<>
  <button
    onClick={() => setShowProfileModal(true)}
    className="w-8 h-8 rounded-full overflow-hidden bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center transition-colors shrink-0"
    title="Edit Profil"
  >
    {guru?.photoUrl
      ? <img src={guru.photoUrl} alt={guru.name} className="w-full h-full object-cover" />
      : <Users size={16} className="text-white" />
    }
  </button>
  <button
    onClick={onLogout}
    className="p-2 hover:bg-emerald-600 rounded-full transition-colors"
    title="Keluar"
  >
    <LogOut size={20} />
  </button>
</>
```

### Catatan penting GuruDashboard:
- View `'presentation'` — jika sebelumnya merender full-screen (tanpa header), pertahankan
  perilaku itu: ketika `view === 'presentation'`, kembalikan elemen full-screen langsung
  **sebelum** `PageLayout` (early return), karena mode presentasi memang harus menutupi
  seluruh layar tanpa header/footer.
- Tombol **"Kembali"** yang ada di header lama (saat view !== 'list') — pindahkan sebagai
  tombol di dalam konten (atas konten detail/recap), bukan di header.
- Semua modal (`ProfileModal`, `ConfirmModal`, `GuruReviewSubmissionModal`, `BlpPeriodModal`)
  harus tetap render di posisi yang sama (di dalam atau setelah konten utama).
- State, handler, semua logika bisnis — **tidak boleh berubah sama sekali**.

---

## Kriteria Selesai

1. `SiswaDashboard.tsx`:
   - Tidak ada `<header>` inline maupun `<nav>` fixed di dalamnya.
   - Menggunakan `PageLayout` dengan `navItems` 3 tab dan `actions` dark mode + logout.
   - Semua tab (Harian, Kalender, Pengaturan) masih berfungsi.
   - Tombol edit profil siswa masih ada dan membuka `ProfileModal`.
   - Dark mode toggle masih berfungsi.
   - Semua modal masih berfungsi.

2. `GuruDashboard.tsx`:
   - Tidak ada fungsi `renderHeader` maupun `<header>` inline.
   - Menggunakan `PageLayout` dengan `navItems` 2 tab dan `actions` profil + logout.
   - Tab "Daftar Siswa" dan "Rekap Nilai" berfungsi.
   - View `'presentation'` tetap full-screen (early return tanpa PageLayout).
   - Tombol "Kembali" dari detail/recap masih ada (di dalam konten, bukan di header).
   - Semua modal masih berfungsi.

3. Ambil **screenshot** tampilan:
   - Halaman login (sudah ada header & footer dari Prompt 01)
   - Dashboard siswa (header dengan 3 tab navigasi, footer di bawah)
   - Dashboard guru — jika ada akun guru untuk dicoba, jika tidak cukup verifikasi
     dari kode bahwa struktur sudah benar.

4. Workflow `npm run dev` tetap jalan. Tidak ada TypeScript error (`npm run lint`).

5. **Tidak ada perubahan** pada:
   - `src/App.tsx`
   - `src/utils/`
   - `src/data/`
   - `src/components/modals/`
   - `server/`
