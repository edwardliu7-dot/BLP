import { Category } from '../types';

// The teacher's BLP is intentionally a separate checklist from the student
// checklist. Keep these IDs stable so a teacher's historical checkmarks remain
// readable when the wording is refined later.
export const GURU_BLP_CATEGORIES: Category[] = [
  {
    id: 'guru-kesadaran-diri',
    name: 'KESADARAN DIRI',
    label: 'Kesadaran Diri',
    activities: [
      {
        id: 'guru-d1',
        name: 'Sholat 5 Waktu Berjamaah dan berdzikir (sholawat dan do’a)',
        target: 'Setiap hari',
      },
    ],
  },
  {
    id: 'guru-keteguhan',
    name: 'KETEGUHAN',
    label: 'Keteguhan',
    activities: [
      {
        id: 'guru-d2',
        name: 'Menjaga Sholat Sunah Rawatib',
        target: 'Setiap hari',
      },
    ],
  },
  {
    id: 'guru-sumber-pengetahuan',
    name: 'MENCARI SUMBER PENGETAHUAN',
    label: 'Mencari Sumber Pengetahuan',
    activities: [
      {
        id: 'guru-d3',
        name: "Membaca Al-Qur'an Minimal 1 Lembar dan mentadaburinya",
        target: 'Setiap hari',
      },
    ],
  },
  {
    id: 'guru-muhasabah',
    name: 'REFLEKSI / MUHASABAH',
    label: 'Refleksi / Muhasabah',
    activities: [
      {
        id: 'guru-d4',
        name: 'Mensyukuri nikmat Allah dengan berinfaq atau berbuat kebaikan',
        target: 'Setiap hari',
      },
    ],
  },
  {
    id: 'guru-kemandirian',
    name: 'KEMANDIRIAN',
    label: 'Kemandirian',
    activities: [
      {
        id: 'guru-d5',
        name: 'Bersikap mandiri dan bertanggung jawab atas apa yang menjadi kewajiban, baik di rumah maupun di sekolah.',
        target: 'Setiap hari',
      },
    ],
  },
];

export const GURU_BLP_ACTIVITY_IDS = GURU_BLP_CATEGORIES.flatMap(category =>
  category.activities.map(activity => activity.id)
);