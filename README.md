# BLP Harian — TISA Islamic School

Aplikasi web untuk pencatatan dan pemantauan **Building Learning Power (BLP) Harian** siswa SMP TISA Islamic School. Dirancang untuk membantu siswa membangun kebiasaan positif dan memudahkan guru wali dalam memantau perkembangan siswa.

---

## Tentang Aplikasi

**BLP Harian** adalah sistem pencatatan *amaliyah harian* (aktivitas ibadah dan karakter harian) berbasis web. Siswa mencatat kegiatan ibadah setiap hari, sementara guru wali kelas dapat memantau, meninjau submisi, dan mengekspor laporan perkembangan siswa.

---

## Fitur Utama

### Untuk Siswa
- **Checklist Aktivitas Harian** — Tandai kegiatan yang telah diselesaikan setiap hari (sholat, membaca Al-Qur'an, dan kegiatan lainnya)
- **Submisi Bukti** — Unggah bukti berupa teks atau rekaman audio untuk aktivitas yang memerlukan verifikasi
- **Bacaan Al-Qur'an** — Catat posisi bacaan dengan pilihan berdasarkan:
  - Surah dan Ayat (dengan tampilan teks dan terjemahan Indonesia)
  - Halaman mushaf (1-604)
- **Catatan Haid** — Fitur khusus untuk menandai hari-hari di mana aktivitas ibadah tertentu dimaklumi
- **Riwayat Aktivitas** — Lihat dan kelola riwayat aktivitas per hari dengan tampilan kalender
- **Profil** — Kelola data profil pribadi

### Untuk Guru (Wali Kelas)
- **Dashboard Kelas** — Pantau status aktivitas seluruh siswa dalam satu tampilan
- **Review Submisi** — Tinjau bukti teks dan audio yang dikirimkan siswa
- **Recap Penilaian** — Lihat rekap capaian siswa per bulan dengan perhitungan otomatis target dan pencapaian
- **Data Haid** — Lihat ringkasan periode haid siswa untuk penyesuaian penilaian
- **Ekspor Laporan** — Unduh rekap data siswa dalam format PDF
- **Manajemen Periode BLP** — Atur periode aktif BLP per kelas per bulan

---

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Lucide React |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Autentikasi | express-session, bcryptjs |
| API Eksternal | Google Gemini AI API |
| Ekspor | jsPDF, jsPDF AutoTable, ExcelJS |
| Utilitas | date-fns, react-easy-crop |

---

## Prasyarat

- Node.js ≥ 18
- PostgreSQL
- Google Gemini API Key (untuk fitur AI)

---

## Cara Menjalankan

### Instalasi

```bash
npm install
```

### Konfigurasi Environment

Buat file `.env` di root directory dengan konten berikut:

```env
GEMINI_API_KEY=your_gemini_api_key_here
APP_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/blp
SESSION_SECRET=your_session_secret_here
```

**Catatan:** Lihat `.env.example` untuk referensi lengkap variabel yang tersedia.

### Development

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

### Production

```bash
npm run build
npm start
```

### Linting TypeScript

```bash
npm run lint
```

---

## Struktur Aplikasi

```
├── server/           # Backend Express API
├── src/
│  ├── components/    # React components untuk UI
│  │  ├── SiswaDashboard.tsx     # Dashboard siswa
│  │  ├── GuruDashboard.tsx      # Dashboard guru
│  │  └── modals/               # Modal components
│  ├── utils/         # Utility functions
│  ├── types/         # TypeScript type definitions
│  └── App.tsx        # Main app component
├── db/               # Database scripts dan migrations
├── public/           # Static assets
└── package.json      # Dependencies
```

---

## Struktur Pengguna

| Peran | Keterangan |
|---|---|
| **Siswa** | Mencatat aktivitas harian, menyimpan bukti submisi, memantau progres pribadi |
| **Guru (Wali Kelas)** | Memantau kelas, meninjau submisi siswa, mengekspor laporan, mengelola periode BLP |

> **Catatan:** Akun siswa dan guru dikelola melalui sistem autentikasi yang terintegrasi dengan aplikasi. Pastikan kredensial login disediakan oleh administrator sekolah.

---

## Fitur Tambahan

- **Tema Aplikasi** — Pilih dari 4 tema: Light, Dark, Ocean, Rose
- **Reminder Notifikasi** — Pengingat aktivitas harian yang dapat diaktifkan
- **Perhitungan Otomatis** — Sistem scoring otomatis dengan pertimbangan:
  - Hari kerja vs akhir pekan
  - Periode haid (auto-credit untuk aktivitas tertentu)
  - Status aktivitas di periode BLP yang berlaku

---

## Lisensi

Dikembangkan khusus untuk SMP TISA Islamic School.
