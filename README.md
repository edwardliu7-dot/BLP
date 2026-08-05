# BLP Harian — TISA Islamic School

Aplikasi web untuk pencatatan dan pemantauan **Building Learning Power (BLP) Harian** siswa SMP TISA Islamic School. Dirancang untuk membantu siswa membangun kebiasaan positif dan memudahkan guru wali kelas dalam memonitor perkembangan karakter siswa setiap harinya.

---

## Tentang Aplikasi

BLP Harian adalah sistem pencatatan *amaliyah harian* (aktivitas harian) berbasis web. Siswa mencatat kegiatan ibadah dan karakter setiap hari, sementara guru wali kelas dapat memantau, menilai, dan mengekspor rekap data kelas mereka.

---

## Fitur Utama

### Untuk Siswa
- **Checklist Aktivitas Harian** — Tandai kegiatan yang telah diselesaikan setiap hari (sholat, membaca Al-Qur'an, dsb.)
- **Submisi Bukti** — Unggah bukti berupa teks atau rekaman audio untuk aktivitas tertentu
- **Bookmark Al-Qur'an** — Simpan posisi bacaan (surah, ayat, halaman) secara persisten
- **Catatan Haid** — Fitur khusus untuk menandai hari-hari di mana aktivitas ibadah tertentu dimaklumi
- **Riwayat & Skor** — Lihat rekap aktivitas dan nilai BLP per bulan
- **Profil** — Atur foto profil dan bio pribadi

### Untuk Guru (Wali Kelas)
- **Dashboard Kelas** — Pantau progres seluruh siswa dalam satu tampilan
- **Review Submisi** — Tinjau bukti teks dan audio yang dikirimkan siswa
- **Manajemen Periode** — Atur periode aktif BLP per kelas per bulan
- **Ekspor Laporan** — Unduh rekap data kelas dalam format Excel atau PDF
- **Manajemen Profil Siswa** — Lihat dan kelola data siswa di kelas

---

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Autentikasi | express-session, bcryptjs |
| Ekspor | ExcelJS, jsPDF |
| Animasi | Motion (Framer Motion) |

---

## Cara Menjalankan

### Prasyarat
- Node.js ≥ 18
- PostgreSQL

### Instalasi

```bash
npm install
```

### Environment Variables

Buat file `.env` atau atur variabel berikut di environment:

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `SESSION_SECRET` | Secret key untuk session |

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

---

## Struktur Pengguna

| Peran | Keterangan |
|---|---|
| **Siswa** | Mencatat aktivitas harian dan memantau skor pribadi |
| **Guru (Wali Kelas)** | Memantau kelas, menilai submisi, mengekspor laporan |

> **Catatan:** Akun siswa dan guru dikelola oleh sistem eksternal (EOB5guru). Aplikasi ini tidak menyediakan fitur registrasi akun baru secara mandiri.

---

## Lisensi

Dikembangkan khusus untuk SMP TISA Islamic School.
