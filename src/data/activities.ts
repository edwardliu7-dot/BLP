/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category } from '../types';

export interface ChecklistItem {
  id: string;
  label: string;
}

export const PERLENGKAPAN_SEKOLAH_ITEMS: ChecklistItem[] = [
  { id: 'buku_paket', label: 'Buku Paket' },
  { id: 'alat_tulis', label: 'Alat Tulis' },
  { id: 'buku_tulis', label: 'Buku Tulis' },
  { id: 'seragam', label: 'Seragam' },
  { id: 'botol_minum', label: 'Botol Minum' },
];

// Records before this date must continue to use the original checklist.
// The new checklist uses different IDs so historical completed IDs can never
// accidentally appear as completed points in the new version.
export const BLP_CHANGEOVER_DATE = '2026-09-01';

export const LEGACY_BLP_CATEGORIES: Category[] = [
  {
    id: 'devout',
    name: 'DEVOUT (KESADARAN DIRI)',
    label: 'Devout',
    activities: [
      { id: 'd1', name: 'Shalat 5 Waktu Berjamaah', target: 'Setiap hari' },
      { id: 'd2', name: "Berdzikir ba'da Sholat", target: 'Setiap hari' },
      { id: 'd3', name: 'Bersholawat Nabi Muhammad', target: 'Setiap hari' },
      { id: 'd4', name: 'Sholat Dhuha', target: 'Setiap hari' },
      { id: 'd5', name: 'Membaca Al Qur\'an', target: 'Setiap hari' },
      { id: 'd6', name: 'Sholat sunnah Rawatib', target: 'Setiap hari' },
      { id: 'd7', name: 'Infaq Sodakoh', target: 'Setiap hari' },
      { id: 'd8', name: 'Mendo\'akan Orang Tua', target: 'Setiap hari' },
    ],
  },
  {
    id: 'resilience',
    name: 'RESILIENCE (KETEGUHAN)',
    label: 'Resilience',
    activities: [
      { id: 'r1', name: 'Datang Ke Sekolah Tepat Waktu', target: 'Setiap hari' },
      { id: 'r2', name: 'Bertanggung Jawab', target: 'Setiap hari' },
      { id: 'r3', name: 'Sholat Tahajud', target: 'Setiap hari' },
      { id: 'r4', name: 'Olahraga / Berjalan 200-300 m', target: 'Setiap hari' },
    ],
  },
  {
    id: 'resourcefulness',
    name: 'RESOURCEFULLNESS (MENCARI SUMBER PENGETAHUAN)',
    label: 'Resourcefulness',
    activities: [
      { id: 'rs1', name: 'Belajar setiap hari min. 30 menit', target: 'Setiap hari' },
      { id: 'rs2', name: 'Hafal Ayat Al Qur\'an dan artinya', target: 'Setiap hari' },
      { id: 'rs3', name: 'Memanfaatkan Internet (Positif)', target: 'Setiap hari' },
      { id: 'rs4', name: 'Hafal Hadits Shohih dan artinya', target: 'Satu Pekan' },
    ],
  },
  {
    id: 'reflectiveness',
    name: 'REFLECTIVENESS (REFLEKSI/MUHASABAH)',
    label: 'Reflectiveness',
    activities: [
      { id: 'rf1', name: 'Sholat Taubat 2 Rakaat', target: 'Setiap hari' },
      { id: 'rf2', name: 'Istighfar min 100x', target: 'Setiap hari' },
      { id: 'rf3', name: 'Evaluasi Diri Sebelum Tidur', target: 'Setiap hari' },
    ],
  },
  {
    id: 'reciprocity',
    name: 'RECIPROCITY (Kemandirian)',
    label: 'Reciprocity',
    activities: [
      { id: 'rp1', name: 'Menyiapkan Perlengkapan sekolah sendiri', target: 'Setiap hari' },
      { id: 'rp2', name: 'Membantu Kesulitan Orang Lain', target: 'Setiap hari' },
      { id: 'rp3', name: 'Bekerjasama', target: 'Setiap hari' },
      { id: 'rp4', name: 'Peka terhadap situasi', target: 'Setiap hari' },
    ],
  },
];

export const CURRENT_BLP_CATEGORIES: Category[] = [
  {
    id: 'devout',
    name: 'KESADARAN DIRI',
    label: 'Kesadaran Diri',
    activities: [
      { id: 'v20260901-d1', name: 'Sholat Subuh Berjamaah', target: 'Setiap hari' },
      { id: 'v20260901-d2', name: 'Sholat Dzuhur Berjamaah', target: 'Setiap hari' },
      { id: 'v20260901-d3', name: 'Sholat Ashar Berjamaah', target: 'Setiap hari' },
      { id: 'v20260901-d4', name: 'Sholat Magrib berjamaah', target: 'Setiap hari' },
      { id: 'v20260901-d5', name: 'Sholat Isya Berjamaah', target: 'Setiap hari' },
      { id: 'v20260901-d6', name: "Berdzikir ba'da Sholat 5 waktu", target: 'Setiap hari' },
      { id: 'v20260901-d7', name: "Bersholawat 33x ba'da sholat 5 waktu", target: 'Setiap hari' },
      { id: 'v20260901-d8', name: "Mendo'akan Orang Tua", target: 'Setiap hari' },
    ],
  },
  {
    id: 'resilience',
    name: 'KETEGUHAN',
    label: 'Keteguhan',
    activities: [
      { id: 'v20260901-r1', name: 'Tidur Malam jam 21.00 WIB', target: 'Setiap hari' },
      { id: 'v20260901-r2', name: 'Sholat Qiyamullail / Tahajudd', target: 'Setiap hari' },
      { id: 'v20260901-r3', name: 'Sholat Witir', target: 'Setiap hari' },
      { id: 'v20260901-r4', name: 'Bangun Jam 4 Pagi', target: 'Setiap hari' },
      { id: 'v20260901-r5', name: 'Mandi sebelum Subuh', target: 'Setiap hari' },
      { id: 'v20260901-r6', name: 'Berjalan Kaki 200-300 meter', target: 'Setiap hari' },
      { id: 'v20260901-r7', name: 'Menjaga Sholat Sunnah Ba’diah & Qobliyah', target: 'Setiap hari' },
      { id: 'v20260901-r8', name: 'Sholat Dhuha', target: 'Setiap hari' },
    ],
  },
  {
    id: 'resourcefulness',
    name: 'MENCARI SUMBER PENGETAHUAN',
    label: 'Mencari Sumber Pengetahuan',
    activities: [
      { id: 'v20260901-rs1', name: 'Belajar mandiri di rumah 30-60 menit', target: 'Setiap hari' },
      { id: 'v20260901-rs2', name: 'Mengetahui Ayat Al Quran yg berhubungan dg KBM', target: 'Setiap hari' },
      { id: 'v20260901-rs3', name: 'Menggunakan HP di rumah untuk Belajar', target: 'Setiap hari' },
      { id: 'v20260901-rs4', name: "Membaca Al qur'an min 1 lembar di rumah", target: 'Setiap hari' },
      { id: 'v20260901-rs5', name: 'Mengetahui hadits yg berhubungan dg KBM', target: 'Setiap hari' },
      { id: 'v20260901-rs6', name: 'Aktif di Musholah/ Masjid di Lingkungan Rumah', target: 'Setiap hari' },
      { id: 'v20260901-rs7', name: 'Mengikuti pengajian di musolah/masjid', target: 'Setiap hari' },
    ],
  },
  {
    id: 'reflectiveness',
    name: 'REFLEKSI / MUHASABAH',
    label: 'Refleksi / Muhasabah',
    activities: [
      { id: 'v20260901-rf1', name: 'Gemar Berinfaq', target: 'Setiap hari' },
      { id: 'v20260901-rf2', name: 'Gemar memaafkan', target: 'Setiap hari' },
      { id: 'v20260901-rf3', name: "Membaca Istighfar 33x ba'da sholat wajib", target: 'Setiap hari' },
      { id: 'v20260901-rf4', name: 'Sholat Taubat 2 Rakaat', target: 'Setiap hari' },
      { id: 'v20260901-rf5', name: 'Muhasabah sebelum tidur', target: 'Setiap hari' },
      { id: 'v20260901-rf6', name: 'Mengisi BLP sebelum tidur', target: 'Setiap hari' },
      { id: 'v20260901-rf7', name: 'Mengingat Kebaikan Orang Lain', target: 'Setiap hari' },
    ],
  },
  {
    id: 'reciprocity',
    name: 'KEMANDIRIAN',
    label: 'Kemandirian',
    activities: [
      { id: 'v20260901-rp1', name: 'Merapihkan tempat tidur sendiri', target: 'Setiap hari' },
      { id: 'v20260901-rp2', name: 'Mencuci piring & gelas setelah makan', target: 'Setiap hari' },
      { id: 'v20260901-rp3', name: 'Mencuci baju & pakaian', target: 'Setiap hari' },
      { id: 'v20260901-rp4', name: 'Merapihkan buku Paket & tulis pd malam hari', target: 'Setiap hari' },
      { id: 'v20260901-rp5', name: 'Menjaga Kesehatan dg makanan yg bergizi', target: 'Setiap hari' },
      { id: 'v20260901-rp6', name: 'Menolong ayah/Ibu d rumah', target: 'Setiap hari' },
      { id: 'v20260901-rp7', name: 'Berkerjasama & saling menghargai', target: 'Setiap hari' },
    ],
  },
];

// Kept as the legacy default for code that needs to render an explicitly
// historical record. New code should use getBlpCategoriesForDate().
export const BLP_CATEGORIES = LEGACY_BLP_CATEGORIES;

function dateKey(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getBlpCategoriesForDate(value: Date | string): Category[] {
  return dateKey(value) >= BLP_CHANGEOVER_DATE
    ? CURRENT_BLP_CATEGORIES
    : LEGACY_BLP_CATEGORIES;
}
