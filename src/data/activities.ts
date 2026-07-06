/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category } from '../types';

export const BLP_CATEGORIES: Category[] = [
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
