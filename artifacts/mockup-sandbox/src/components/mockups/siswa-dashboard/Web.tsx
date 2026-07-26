import {
  Star,
  CheckCircle2,
  Circle,
  BookOpen,
  Shield,
  Brain,
  Heart,
  Handshake,
  Moon,
  Sun,
  Music,
  FileText,
  ChevronRight,
  Bell,
  LogOut,
  Calendar,
  Settings,
  TrendingUp,
  Award,
  Mic,
  Lock,
} from "lucide-react";

const categories = [
  {
    id: "devout",
    label: "Ketaqwaan",
    icon: Moon,
    color: "emerald",
    bgFrom: "from-emerald-500",
    bgTo: "to-teal-500",
    lightBg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    activities: [
      { label: "Shalat Subuh Berjamaah", done: true, type: "check" },
      { label: "Tilawah Al-Qur'an (1 Halaman)", done: true, type: "audio", surah: "Al-Baqarah 1-5" },
      { label: "Shalat Dhuha", done: true, type: "check" },
      { label: "Dzikir Pagi", done: false, type: "check" },
      { label: "Shalat Dzuhur Berjamaah", done: true, type: "check" },
    ],
  },
  {
    id: "resilience",
    label: "Ketangguhan",
    icon: Shield,
    color: "amber",
    bgFrom: "from-amber-500",
    bgTo: "to-orange-400",
    lightBg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    activities: [
      { label: "Olahraga Pagi (30 menit)", done: true, type: "check" },
      { label: "Rapi Kamar Tidur", done: true, type: "check" },
      { label: "Makan Tepat Waktu", done: false, type: "check" },
    ],
  },
  {
    id: "resourceful",
    label: "Kecakapan",
    icon: Brain,
    color: "blue",
    bgFrom: "from-blue-500",
    bgTo: "to-sky-400",
    lightBg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    activities: [
      { label: "Membaca Buku (15 menit)", done: true, type: "check" },
      { label: "Menulis Refleksi Harian", done: false, type: "text" },
      { label: "Belajar Mandiri", done: true, type: "check" },
    ],
  },
  {
    id: "reflective",
    label: "Reflektif",
    icon: Heart,
    color: "violet",
    bgFrom: "from-violet-500",
    bgTo: "to-purple-400",
    lightBg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    activities: [
      { label: "Jurnal Syukur (3 hal)", done: true, type: "text" },
      { label: "Evaluasi Diri", done: false, type: "text" },
    ],
  },
  {
    id: "reciprocity",
    label: "Kepedulian",
    icon: Handshake,
    color: "rose",
    bgFrom: "from-rose-500",
    bgTo: "to-pink-400",
    lightBg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    activities: [
      { label: "Membantu Orang Tua", done: true, type: "check" },
      { label: "Berbuat Baik kepada Teman", done: false, type: "check" },
    ],
  },
];

const doneCount = categories.flatMap((c) => c.activities).filter((a) => a.done).length;
const totalCount = categories.flatMap((c) => c.activities).length;
const pct = Math.round((doneCount / totalCount) * 100);

export function Web() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold">B</div>
            <div>
              <div className="font-bold text-lg leading-tight">BLP Harian</div>
              <div className="text-xs text-emerald-100">SMP TISA Islamic School</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold">Aisyah Rahmawati</div>
              <div className="text-xs text-emerald-100">Kelas 7A</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">AR</div>
            <button className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition">
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Nav */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 flex gap-1">
          {[
            { icon: CheckCircle2, label: "Harian", active: true },
            { icon: Calendar, label: "Kalender", active: false },
            { icon: Settings, label: "Pengaturan", active: false },
          ].map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition ${
                active ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Score hero */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white mb-6 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-sm text-emerald-100 mb-1">Sabtu, 26 Juli 2025</div>
            <div className="text-4xl font-bold mb-1">87</div>
            <div className="text-sm text-emerald-100">Skor BLP Hari Ini</div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= 4 ? "fill-amber-300 text-amber-300" : "text-white/30"}`} />)}
              </div>
              <span className="text-xs text-emerald-100">Hampir sempurna!</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="white" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40 * pct / 100} ${2 * Math.PI * 40}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{pct}%</span>
                <span className="text-xs text-emerald-100">{doneCount}/{totalCount}</span>
              </div>
            </div>
            <div className="text-xs text-emerald-100 mt-2">Aktivitas selesai</div>
          </div>
        </div>

        {/* Activity categories */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const catDone = cat.activities.filter((a) => a.done).length;
            return (
              <div key={cat.id} className={`bg-white rounded-2xl border ${cat.border} shadow-sm overflow-hidden`}>
                <div className={`bg-gradient-to-r ${cat.bgFrom} ${cat.bgTo} px-4 py-3 flex items-center gap-2`}>
                  <Icon className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">{cat.label}</span>
                  <span className="ml-auto text-xs text-white/80">{catDone}/{cat.activities.length}</span>
                </div>
                <div className={`h-1 bg-gray-100`}>
                  <div
                    className={`h-full bg-gradient-to-r ${cat.bgFrom} ${cat.bgTo}`}
                    style={{ width: `${(catDone / cat.activities.length) * 100}%` }}
                  />
                </div>
                <div className="p-3 space-y-2">
                  {cat.activities.map((act) => (
                    <div key={act.label} className={`flex items-center gap-2.5 p-2.5 rounded-xl ${act.done ? cat.lightBg : "bg-gray-50"}`}>
                      {act.done ? (
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${cat.text}`} />
                      ) : (
                        <Circle className="w-4 h-4 flex-shrink-0 text-gray-300" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium truncate ${act.done ? cat.text : "text-gray-500"}`}>
                          {act.label}
                        </div>
                        {act.type === "audio" && act.done && (
                          <div className="text-xs text-gray-400">{(act as any).surah}</div>
                        )}
                      </div>
                      {act.type === "audio" && (
                        <Mic className={`w-3.5 h-3.5 flex-shrink-0 ${act.done ? cat.text : "text-gray-300"}`} />
                      )}
                      {act.type === "text" && (
                        <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${act.done ? cat.text : "text-gray-300"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Score breakdown card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-4 py-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Rincian Skor</span>
            </div>
            <div className="p-4 space-y-2.5">
              {categories.map((cat) => {
                const catDone = cat.activities.filter((a) => a.done).length;
                const p = Math.round((catDone / cat.activities.length) * 100);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium ${cat.text}`}>{cat.label}</span>
                      <span className="text-gray-500">{p}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${cat.bgFrom} ${cat.bgTo} rounded-full`} style={{ width: `${p}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
