/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Surah {
  no: number;
  nameArab: string;
  nameLatin: string;
  translatedName: string;
  ayatCount: number;
  revelationPlace: 'makkah' | 'madinah';
}

// Data 114 surah Al-Qur'an (nomor, nama, jumlah ayat) — digunakan agar siswa
// dapat memilih surah & ayat yang dibaca, bukan selalu Al-Fatihah.
export const SURAH_LIST: Surah[] = [
  {
    ayatCount: 7,
    nameArab: "الفاتحة",
    nameLatin: "Al-Fatihah",
    no: 1,
    revelationPlace: "makkah",
    translatedName: "Pembukaan"
  },
  {
    ayatCount: 286,
    nameArab: "البقرة",
    nameLatin: "Al-Baqarah",
    no: 2,
    revelationPlace: "madinah",
    translatedName: "Sapi Betina"
  },
  {
    ayatCount: 200,
    nameArab: "آل عمران",
    nameLatin: "Ali 'Imran",
    no: 3,
    revelationPlace: "madinah",
    translatedName: "Keluarga Imran"
  },
  {
    ayatCount: 176,
    nameArab: "النساء",
    nameLatin: "An-Nisa",
    no: 4,
    revelationPlace: "madinah",
    translatedName: "Wanita"
  },
  {
    ayatCount: 120,
    nameArab: "المائدة",
    nameLatin: "Al-Ma'idah",
    no: 5,
    revelationPlace: "madinah",
    translatedName: "Jamuan (Hidangan Makanan)"
  },
  {
    ayatCount: 165,
    nameArab: "الأنعام",
    nameLatin: "Al-An'am",
    no: 6,
    revelationPlace: "makkah",
    translatedName: "Binatang Ternak"
  },
  {
    ayatCount: 206,
    nameArab: "الأعراف",
    nameLatin: "Al-A'raf",
    no: 7,
    revelationPlace: "makkah",
    translatedName: "Tempat-tempat Tinggi"
  },
  {
    ayatCount: 75,
    nameArab: "الأنفال",
    nameLatin: "Al-Anfal",
    no: 8,
    revelationPlace: "madinah",
    translatedName: "Rampasan Perang"
  },
  {
    ayatCount: 129,
    nameArab: "التوبة",
    nameLatin: "At-Tawbah",
    no: 9,
    revelationPlace: "madinah",
    translatedName: "Pengampunan"
  },
  {
    ayatCount: 109,
    nameArab: "يونس",
    nameLatin: "Yunus",
    no: 10,
    revelationPlace: "makkah",
    translatedName: "Yunus"
  },
  {
    ayatCount: 123,
    nameArab: "هود",
    nameLatin: "Hud",
    no: 11,
    revelationPlace: "makkah",
    translatedName: "Hud"
  },
  {
    ayatCount: 111,
    nameArab: "يوسف",
    nameLatin: "Yusuf",
    no: 12,
    revelationPlace: "makkah",
    translatedName: "Yusuf"
  },
  {
    ayatCount: 43,
    nameArab: "الرعد",
    nameLatin: "Ar-Ra'd",
    no: 13,
    revelationPlace: "madinah",
    translatedName: "Guruh (Petir)"
  },
  {
    ayatCount: 52,
    nameArab: "ابراهيم",
    nameLatin: "Ibrahim",
    no: 14,
    revelationPlace: "makkah",
    translatedName: "Ibrahim"
  },
  {
    ayatCount: 99,
    nameArab: "الحجر",
    nameLatin: "Al-Hijr",
    no: 15,
    revelationPlace: "makkah",
    translatedName: "Bukit"
  },
  {
    ayatCount: 128,
    nameArab: "النحل",
    nameLatin: "An-Nahl",
    no: 16,
    revelationPlace: "makkah",
    translatedName: "Lebah Madu"
  },
  {
    ayatCount: 111,
    nameArab: "الإسراء",
    nameLatin: "Al-Isra",
    no: 17,
    revelationPlace: "makkah",
    translatedName: "Perjalanan Malam"
  },
  {
    ayatCount: 110,
    nameArab: "الكهف",
    nameLatin: "Al-Kahf",
    no: 18,
    revelationPlace: "makkah",
    translatedName: "Para Penghuni Gua"
  },
  {
    ayatCount: 98,
    nameArab: "مريم",
    nameLatin: "Maryam",
    no: 19,
    revelationPlace: "makkah",
    translatedName: "Maryam"
  },
  {
    ayatCount: 135,
    nameArab: "طه",
    nameLatin: "Taha",
    no: 20,
    revelationPlace: "makkah",
    translatedName: "Tha-Ha"
  },
  {
    ayatCount: 112,
    nameArab: "الأنبياء",
    nameLatin: "Al-Anbya",
    no: 21,
    revelationPlace: "makkah",
    translatedName: "Para Nabi"
  },
  {
    ayatCount: 78,
    nameArab: "الحج",
    nameLatin: "Al-Hajj",
    no: 22,
    revelationPlace: "madinah",
    translatedName: "Haji"
  },
  {
    ayatCount: 118,
    nameArab: "المؤمنون",
    nameLatin: "Al-Mu'minun",
    no: 23,
    revelationPlace: "makkah",
    translatedName: "Orang-orang Mukmin"
  },
  {
    ayatCount: 64,
    nameArab: "النور",
    nameLatin: "An-Nur",
    no: 24,
    revelationPlace: "madinah",
    translatedName: "Cahaya"
  },
  {
    ayatCount: 77,
    nameArab: "الفرقان",
    nameLatin: "Al-Furqan",
    no: 25,
    revelationPlace: "makkah",
    translatedName: "Pembeda"
  },
  {
    ayatCount: 227,
    nameArab: "الشعراء",
    nameLatin: "Ash-Shu'ara",
    no: 26,
    revelationPlace: "makkah",
    translatedName: "Penyair"
  },
  {
    ayatCount: 93,
    nameArab: "النمل",
    nameLatin: "An-Naml",
    no: 27,
    revelationPlace: "makkah",
    translatedName: "Semut"
  },
  {
    ayatCount: 88,
    nameArab: "القصص",
    nameLatin: "Al-Qasas",
    no: 28,
    revelationPlace: "makkah",
    translatedName: "Kisah-kisah"
  },
  {
    ayatCount: 69,
    nameArab: "العنكبوت",
    nameLatin: "Al-'Ankabut",
    no: 29,
    revelationPlace: "makkah",
    translatedName: "Laba-laba"
  },
  {
    ayatCount: 60,
    nameArab: "الروم",
    nameLatin: "Ar-Rum",
    no: 30,
    revelationPlace: "makkah",
    translatedName: "Bangsa Romawi"
  },
  {
    ayatCount: 34,
    nameArab: "لقمان",
    nameLatin: "Luqman",
    no: 31,
    revelationPlace: "makkah",
    translatedName: "Luqman"
  },
  {
    ayatCount: 30,
    nameArab: "السجدة",
    nameLatin: "As-Sajdah",
    no: 32,
    revelationPlace: "makkah",
    translatedName: "Sujud"
  },
  {
    ayatCount: 73,
    nameArab: "الأحزاب",
    nameLatin: "Al-Ahzab",
    no: 33,
    revelationPlace: "madinah",
    translatedName: "Golongan yang Bersekutu"
  },
  {
    ayatCount: 54,
    nameArab: "سبإ",
    nameLatin: "Saba",
    no: 34,
    revelationPlace: "makkah",
    translatedName: "Saba\\'"
  },
  {
    ayatCount: 45,
    nameArab: "فاطر",
    nameLatin: "Fatir",
    no: 35,
    revelationPlace: "makkah",
    translatedName: "Pencipta"
  },
  {
    ayatCount: 83,
    nameArab: "يس",
    nameLatin: "Ya-Sin",
    no: 36,
    revelationPlace: "makkah",
    translatedName: "Yas Sin"
  },
  {
    ayatCount: 182,
    nameArab: "الصافات",
    nameLatin: "As-Saffat",
    no: 37,
    revelationPlace: "makkah",
    translatedName: "Barisan-barisan"
  },
  {
    ayatCount: 88,
    nameArab: "ص",
    nameLatin: "Sad",
    no: 38,
    revelationPlace: "makkah",
    translatedName: "Shad"
  },
  {
    ayatCount: 75,
    nameArab: "الزمر",
    nameLatin: "Az-Zumar",
    no: 39,
    revelationPlace: "makkah",
    translatedName: "Para Rombongan"
  },
  {
    ayatCount: 85,
    nameArab: "غافر",
    nameLatin: "Ghafir",
    no: 40,
    revelationPlace: "makkah",
    translatedName: "Sang Maha Pengampun"
  },
  {
    ayatCount: 54,
    nameArab: "فصلت",
    nameLatin: "Fussilat",
    no: 41,
    revelationPlace: "makkah",
    translatedName: "Yang Dijelaskan"
  },
  {
    ayatCount: 53,
    nameArab: "الشورى",
    nameLatin: "Ash-Shuraa",
    no: 42,
    revelationPlace: "makkah",
    translatedName: "Musyawarah"
  },
  {
    ayatCount: 89,
    nameArab: "الزخرف",
    nameLatin: "Az-Zukhruf",
    no: 43,
    revelationPlace: "makkah",
    translatedName: "Perhiasan"
  },
  {
    ayatCount: 59,
    nameArab: "الدخان",
    nameLatin: "Ad-Dukhan",
    no: 44,
    revelationPlace: "makkah",
    translatedName: "Kabut"
  },
  {
    ayatCount: 37,
    nameArab: "الجاثية",
    nameLatin: "Al-Jathiyah",
    no: 45,
    revelationPlace: "makkah",
    translatedName: "Yang Bertekuk Lutut"
  },
  {
    ayatCount: 35,
    nameArab: "الأحقاف",
    nameLatin: "Al-Ahqaf",
    no: 46,
    revelationPlace: "makkah",
    translatedName: "Bukit-bukir Pasir"
  },
  {
    ayatCount: 38,
    nameArab: "محمد",
    nameLatin: "Muhammad",
    no: 47,
    revelationPlace: "madinah",
    translatedName: "Muhammad"
  },
  {
    ayatCount: 29,
    nameArab: "الفتح",
    nameLatin: "Al-Fath",
    no: 48,
    revelationPlace: "madinah",
    translatedName: "Kemenangan"
  },
  {
    ayatCount: 18,
    nameArab: "الحجرات",
    nameLatin: "Al-Hujurat",
    no: 49,
    revelationPlace: "madinah",
    translatedName: "Kamar-kamar"
  },
  {
    ayatCount: 45,
    nameArab: "ق",
    nameLatin: "Qaf",
    no: 50,
    revelationPlace: "makkah",
    translatedName: "Qaf"
  },
  {
    ayatCount: 60,
    nameArab: "الذاريات",
    nameLatin: "Adh-Dhariyat",
    no: 51,
    revelationPlace: "makkah",
    translatedName: "Angin yang Menerbangkan"
  },
  {
    ayatCount: 49,
    nameArab: "الطور",
    nameLatin: "At-Tur",
    no: 52,
    revelationPlace: "makkah",
    translatedName: "Bukit"
  },
  {
    ayatCount: 62,
    nameArab: "النجم",
    nameLatin: "An-Najm",
    no: 53,
    revelationPlace: "makkah",
    translatedName: "Bintang"
  },
  {
    ayatCount: 55,
    nameArab: "القمر",
    nameLatin: "Al-Qamar",
    no: 54,
    revelationPlace: "makkah",
    translatedName: "Bulan"
  },
  {
    ayatCount: 78,
    nameArab: "الرحمن",
    nameLatin: "Ar-Rahman",
    no: 55,
    revelationPlace: "madinah",
    translatedName: "Yang Maha Pemurah"
  },
  {
    ayatCount: 96,
    nameArab: "الواقعة",
    nameLatin: "Al-Waqi'ah",
    no: 56,
    revelationPlace: "makkah",
    translatedName: "Hari Kiamat"
  },
  {
    ayatCount: 29,
    nameArab: "الحديد",
    nameLatin: "Al-Hadid",
    no: 57,
    revelationPlace: "madinah",
    translatedName: "Besi"
  },
  {
    ayatCount: 22,
    nameArab: "المجادلة",
    nameLatin: "Al-Mujadila",
    no: 58,
    revelationPlace: "madinah",
    translatedName: "Wanita yang Menggugat"
  },
  {
    ayatCount: 24,
    nameArab: "الحشر",
    nameLatin: "Al-Hashr",
    no: 59,
    revelationPlace: "madinah",
    translatedName: "Pengusiran"
  },
  {
    ayatCount: 13,
    nameArab: "الممتحنة",
    nameLatin: "Al-Mumtahanah",
    no: 60,
    revelationPlace: "madinah",
    translatedName: "Wanita yang Diuji"
  },
  {
    ayatCount: 14,
    nameArab: "الصف",
    nameLatin: "As-Saf",
    no: 61,
    revelationPlace: "madinah",
    translatedName: "Barisan"
  },
  {
    ayatCount: 11,
    nameArab: "الجمعة",
    nameLatin: "Al-Jumu'ah",
    no: 62,
    revelationPlace: "madinah",
    translatedName: "Hari Jum\\'at"
  },
  {
    ayatCount: 11,
    nameArab: "المنافقون",
    nameLatin: "Al-Munafiqun",
    no: 63,
    revelationPlace: "madinah",
    translatedName: "Kaum Munafik"
  },
  {
    ayatCount: 18,
    nameArab: "التغابن",
    nameLatin: "At-Taghabun",
    no: 64,
    revelationPlace: "madinah",
    translatedName: "Hari Dinampakkan Kesalahan"
  },
  {
    ayatCount: 12,
    nameArab: "الطلاق",
    nameLatin: "At-Talaq",
    no: 65,
    revelationPlace: "madinah",
    translatedName: "Perceraian"
  },
  {
    ayatCount: 12,
    nameArab: "التحريم",
    nameLatin: "At-Tahrim",
    no: 66,
    revelationPlace: "madinah",
    translatedName: "Mengharamkan"
  },
  {
    ayatCount: 30,
    nameArab: "الملك",
    nameLatin: "Al-Mulk",
    no: 67,
    revelationPlace: "makkah",
    translatedName: "Kerajaan"
  },
  {
    ayatCount: 52,
    nameArab: "القلم",
    nameLatin: "Al-Qalam",
    no: 68,
    revelationPlace: "makkah",
    translatedName: "Pena"
  },
  {
    ayatCount: 52,
    nameArab: "الحاقة",
    nameLatin: "Al-Haqqah",
    no: 69,
    revelationPlace: "makkah",
    translatedName: "Kenyataan (Hari Kiamat)"
  },
  {
    ayatCount: 44,
    nameArab: "المعارج",
    nameLatin: "Al-Ma'arij",
    no: 70,
    revelationPlace: "makkah",
    translatedName: "Tempat yang Naik"
  },
  {
    ayatCount: 28,
    nameArab: "نوح",
    nameLatin: "Nuh",
    no: 71,
    revelationPlace: "makkah",
    translatedName: "Nuh"
  },
  {
    ayatCount: 28,
    nameArab: "الجن",
    nameLatin: "Al-Jinn",
    no: 72,
    revelationPlace: "makkah",
    translatedName: "Jin"
  },
  {
    ayatCount: 20,
    nameArab: "المزمل",
    nameLatin: "Al-Muzzammil",
    no: 73,
    revelationPlace: "makkah",
    translatedName: "Orang yang Berselimut"
  },
  {
    ayatCount: 56,
    nameArab: "المدثر",
    nameLatin: "Al-Muddaththir",
    no: 74,
    revelationPlace: "makkah",
    translatedName: "Orang yang Berkemul"
  },
  {
    ayatCount: 40,
    nameArab: "القيامة",
    nameLatin: "Al-Qiyamah",
    no: 75,
    revelationPlace: "makkah",
    translatedName: "Hari Berbangkit"
  },
  {
    ayatCount: 31,
    nameArab: "الانسان",
    nameLatin: "Al-Insan",
    no: 76,
    revelationPlace: "madinah",
    translatedName: "Manusia"
  },
  {
    ayatCount: 50,
    nameArab: "المرسلات",
    nameLatin: "Al-Mursalat",
    no: 77,
    revelationPlace: "makkah",
    translatedName: "Malaikat-malaikan yang Diutus"
  },
  {
    ayatCount: 40,
    nameArab: "النبإ",
    nameLatin: "An-Naba",
    no: 78,
    revelationPlace: "makkah",
    translatedName: "Berita Besar"
  },
  {
    ayatCount: 46,
    nameArab: "النازعات",
    nameLatin: "An-Nazi'at",
    no: 79,
    revelationPlace: "makkah",
    translatedName: "Malaikat yang Mencabut"
  },
  {
    ayatCount: 42,
    nameArab: "عبس",
    nameLatin: "'Abasa",
    no: 80,
    revelationPlace: "makkah",
    translatedName: "Ia Bermuka Masam"
  },
  {
    ayatCount: 29,
    nameArab: "التكوير",
    nameLatin: "At-Takwir",
    no: 81,
    revelationPlace: "makkah",
    translatedName: "Menggulung"
  },
  {
    ayatCount: 19,
    nameArab: "الإنفطار",
    nameLatin: "Al-Infitar",
    no: 82,
    revelationPlace: "makkah",
    translatedName: "Terbelah"
  },
  {
    ayatCount: 36,
    nameArab: "المطففين",
    nameLatin: "Al-Mutaffifin",
    no: 83,
    revelationPlace: "makkah",
    translatedName: "Orang-orang Curang"
  },
  {
    ayatCount: 25,
    nameArab: "الإنشقاق",
    nameLatin: "Al-Inshiqaq",
    no: 84,
    revelationPlace: "makkah",
    translatedName: "Terbelah"
  },
  {
    ayatCount: 22,
    nameArab: "البروج",
    nameLatin: "Al-Buruj",
    no: 85,
    revelationPlace: "makkah",
    translatedName: "Gugusan Bintang"
  },
  {
    ayatCount: 17,
    nameArab: "الطارق",
    nameLatin: "At-Tariq",
    no: 86,
    revelationPlace: "makkah",
    translatedName: "Yang Datang di Malam Hari"
  },
  {
    ayatCount: 19,
    nameArab: "الأعلى",
    nameLatin: "Al-A'la",
    no: 87,
    revelationPlace: "makkah",
    translatedName: "Yang Paling Tinggi"
  },
  {
    ayatCount: 26,
    nameArab: "الغاشية",
    nameLatin: "Al-Ghashiyah",
    no: 88,
    revelationPlace: "makkah",
    translatedName: "Hari Pembalasan"
  },
  {
    ayatCount: 30,
    nameArab: "الفجر",
    nameLatin: "Al-Fajr",
    no: 89,
    revelationPlace: "makkah",
    translatedName: "Fajar"
  },
  {
    ayatCount: 20,
    nameArab: "البلد",
    nameLatin: "Al-Balad",
    no: 90,
    revelationPlace: "makkah",
    translatedName: "Negeri"
  },
  {
    ayatCount: 15,
    nameArab: "الشمس",
    nameLatin: "Ash-Shams",
    no: 91,
    revelationPlace: "makkah",
    translatedName: "Matahari"
  },
  {
    ayatCount: 21,
    nameArab: "الليل",
    nameLatin: "Al-Layl",
    no: 92,
    revelationPlace: "makkah",
    translatedName: "Malam"
  },
  {
    ayatCount: 11,
    nameArab: "الضحى",
    nameLatin: "Ad-Duhaa",
    no: 93,
    revelationPlace: "makkah",
    translatedName: "Waktu Dhuha"
  },
  {
    ayatCount: 8,
    nameArab: "الشرح",
    nameLatin: "Ash-Sharh",
    no: 94,
    revelationPlace: "makkah",
    translatedName: "Melapangkan"
  },
  {
    ayatCount: 8,
    nameArab: "التين",
    nameLatin: "At-Tin",
    no: 95,
    revelationPlace: "makkah",
    translatedName: "Buah Tin"
  },
  {
    ayatCount: 19,
    nameArab: "العلق",
    nameLatin: "Al-'Alaq",
    no: 96,
    revelationPlace: "makkah",
    translatedName: "Segumpal Darah"
  },
  {
    ayatCount: 5,
    nameArab: "القدر",
    nameLatin: "Al-Qadr",
    no: 97,
    revelationPlace: "makkah",
    translatedName: "Kemuliaan"
  },
  {
    ayatCount: 8,
    nameArab: "البينة",
    nameLatin: "Al-Bayyinah",
    no: 98,
    revelationPlace: "madinah",
    translatedName: "Pembuktian"
  },
  {
    ayatCount: 8,
    nameArab: "الزلزلة",
    nameLatin: "Az-Zalzalah",
    no: 99,
    revelationPlace: "madinah",
    translatedName: "Kegoncangan"
  },
  {
    ayatCount: 11,
    nameArab: "العاديات",
    nameLatin: "Al-'Adiyat",
    no: 100,
    revelationPlace: "makkah",
    translatedName: "Berlari Kencang"
  },
  {
    ayatCount: 11,
    nameArab: "القارعة",
    nameLatin: "Al-Qari'ah",
    no: 101,
    revelationPlace: "makkah",
    translatedName: "Hari Kiamat"
  },
  {
    ayatCount: 8,
    nameArab: "التكاثر",
    nameLatin: "At-Takathur",
    no: 102,
    revelationPlace: "makkah",
    translatedName: "Bermegah-megahan"
  },
  {
    ayatCount: 3,
    nameArab: "العصر",
    nameLatin: "Al-'Asr",
    no: 103,
    revelationPlace: "makkah",
    translatedName: "Waktu Sore"
  },
  {
    ayatCount: 9,
    nameArab: "الهمزة",
    nameLatin: "Al-Humazah",
    no: 104,
    revelationPlace: "makkah",
    translatedName: "Pengumpat"
  },
  {
    ayatCount: 5,
    nameArab: "الفيل",
    nameLatin: "Al-Fil",
    no: 105,
    revelationPlace: "makkah",
    translatedName: "Gajah"
  },
  {
    ayatCount: 4,
    nameArab: "قريش",
    nameLatin: "Quraysh",
    no: 106,
    revelationPlace: "makkah",
    translatedName: "Suku Quraisy"
  },
  {
    ayatCount: 7,
    nameArab: "الماعون",
    nameLatin: "Al-Ma'un",
    no: 107,
    revelationPlace: "makkah",
    translatedName: "Barang yang Berguna"
  },
  {
    ayatCount: 3,
    nameArab: "الكوثر",
    nameLatin: "Al-Kawthar",
    no: 108,
    revelationPlace: "makkah",
    translatedName: "Nikmat Berlimpah"
  },
  {
    ayatCount: 6,
    nameArab: "الكافرون",
    nameLatin: "Al-Kafirun",
    no: 109,
    revelationPlace: "makkah",
    translatedName: "Orang-orang Kafir"
  },
  {
    ayatCount: 3,
    nameArab: "النصر",
    nameLatin: "An-Nasr",
    no: 110,
    revelationPlace: "madinah",
    translatedName: "Pertolongan"
  },
  {
    ayatCount: 5,
    nameArab: "المسد",
    nameLatin: "Al-Masad",
    no: 111,
    revelationPlace: "makkah",
    translatedName: "Gejolak Api (Sabut)"
  },
  {
    ayatCount: 4,
    nameArab: "الإخلاص",
    nameLatin: "Al-Ikhlas",
    no: 112,
    revelationPlace: "makkah",
    translatedName: "Ikhlash"
  },
  {
    ayatCount: 5,
    nameArab: "الفلق",
    nameLatin: "Al-Falaq",
    no: 113,
    revelationPlace: "makkah",
    translatedName: "Waktu Shubuh"
  },
  {
    ayatCount: 6,
    nameArab: "الناس",
    nameLatin: "An-Nas",
    no: 114,
    revelationPlace: "makkah",
    translatedName: "Umat Manusia"
  }
];

export function getSurah(no: number): Surah | undefined {
  return SURAH_LIST.find(s => s.no === no);
}
