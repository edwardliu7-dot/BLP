import {
  CheckCircle2,
  Circle,
  Moon,
  Shield,
  Brain,
  Heart,
  Handshake,
  Star,
  Mic,
  FileText,
  LogOut,
  Calendar,
  Settings,
  TrendingUp,
  ChevronRight,
  Bell,
} from "lucide-react";

const categories = [
  {
    id: "devout",
    label: "Ketaqwaan",
    icon: Moon,
    bgFrom: "from-emerald-500",
    bgTo: "to-teal-500",
    lightBg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    done: 4,
    total: 5,
  },
  {
    id: "resilience",
    label: "Ketangguhan",
    icon: Shield,
    bgFrom: "from-amber-500",
    bgTo: "to-orange-400",
    lightBg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    done: 2,
    total: 3,
  },
  {
    id: "resourceful",
    label: "Kecakapan",
    icon: Brain,
    bgFrom: "from-blue-500",
    bgTo: "to-sky-400",
    lightBg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    done: 2,
    total: 3,
  },
  {
    id: "reflective",
    label: "Reflektif",
    icon: Heart,
    bgFrom: "from-violet-500",
    bgTo: "to-purple-400",
    lightBg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    done: 1,
    total: 2,
  },
  {
    id: "reciprocity",
    label: "Kepedulian",
    icon: Handshake,
    bgFrom: "from-rose-500",
    bgTo: "to-pink-400",
    lightBg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    done: 1,
    total: 2,
  },
];

const allDone = categories.reduce((s, c) => s + c.done, 0);
const allTotal = categories.reduce((s, c) => s + c.total, 0);
const pct = Math.round((allDone / allTotal) * 100);

const activities = [
  { label: "Shalat Subuh Berjamaah", done: true, type: "check", cat: "emerald" },
  { label: "Tilawah Al-Qur'an", done: true, type: "audio", cat: "emerald", sub: "Al-Baqarah 1-5" },
  { label: "Shalat Dhuha", done: true, type: "check", cat: "emerald" },
  { label: "Dzikir Pagi", done: false, type: "check", cat: "emerald" },
  { label: "Olahraga Pagi (30 menit)", done: true, type: "check", cat: "amber" },
  { label: "Rapi Kamar Tidur", done: true, type: "check", cat: "amber" },
  { label: "Makan Tepat Waktu", done: false, type: "check", cat: "amber" },
  { label: "Membaca Buku (15 menit)", done: true, type: "check", cat: "blue" },
  { label: "Menulis Refleksi Harian", done: false, type: "text", cat: "blue" },
  { label: "Jurnal Syukur (3 hal)", done: true, type: "text", cat: "violet" },
  { label: "Membantu Orang Tua", done: true, type: "check", cat: "rose" },
];

const catColors: Record<string, { text: string; bg: string; dot: string }> = {
  emerald: { text: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  amber: { text: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  blue: { text: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  violet: { text: "text-violet-700", bg: "bg-violet-50", dot: "bg-violet-500" },
  rose: { text: "text-rose-700", bg: "bg-rose-50", dot: "bg-rose-500" },
};

export function Mobile() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans max-w-sm mx-auto flex flex-col">
      {/* Status bar */}
      <div className="bg-emerald-700 px-4 pt-2 pb-0 flex justify-between items-center text-white text-xs">
        <span>09:41</span>
        <span>▂▄▆ ✦ 🔋</span>
      </div>

      {/* Hero header */}
      <div className="bg-gradient-to-b from-emerald-700 to-emerald-600 px-4 pt-3 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">B</div>
            <div>
              <div className="font-bold text-sm">BLP Harian</div>
              <div className="text-xs text-emerald-200">SMP TISA</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 bg-white/10 rounded-xl">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">AR</div>
          </div>
        </div>

        <div className="text-xs text-emerald-100">Sabtu, 26 Juli 2025 · Harian</div>
        <div className="text-base font-bold mt-0.5">Aisyah Rahmawati — Kelas 7A</div>

        {/* Score + ring */}
        <div className="flex items-center gap-5 mt-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="32" fill="none"
                stroke="white" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 32 * pct / 100} ${2 * Math.PI * 32}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold">{pct}%</span>
              <span className="text-xs text-emerald-200">{allDone}/{allTotal}</span>
            </div>
          </div>
          <div>
            <div className="text-4xl font-bold">87</div>
            <div className="text-xs text-emerald-100 mt-0.5">Skor Hari Ini</div>
            <div className="flex mt-1.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= 4 ? "fill-amber-300 text-amber-300" : "text-white/30"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const p = Math.round((cat.done / cat.total) * 100);
            return (
              <div
                key={cat.id}
                className="flex-shrink-0 bg-white/10 backdrop-blur rounded-xl px-3 py-2 flex flex-col items-center gap-1 min-w-[72px]"
              >
                <Icon className="w-4 h-4 text-white" />
                <div className="text-xs text-white font-semibold">{cat.done}/{cat.total}</div>
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${p}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 px-2 flex gap-1 sticky top-0 z-10">
        {[
          { icon: CheckCircle2, label: "Harian", active: true },
          { icon: Calendar, label: "Kalender", active: false },
          { icon: Settings, label: "Pengaturan", active: false },
        ].map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs font-medium border-b-2 gap-1 transition ${
              active ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-400"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Activity list */}
      <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aktivitas Hari Ini</span>
          <span className="text-xs text-emerald-600 font-medium">{allDone} selesai dari {allTotal}</span>
        </div>

        {activities.map((act) => {
          const colors = catColors[act.cat];
          return (
            <div
              key={act.label}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                act.done ? `${colors.bg} border-${act.cat}-200` : "bg-white border-gray-100"
              } shadow-sm`}
            >
              <div className={`w-1 h-9 rounded-full flex-shrink-0 ${colors.dot}`} />
              {act.done ? (
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${colors.text}`} />
              ) : (
                <Circle className="w-5 h-5 flex-shrink-0 text-gray-200" />
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${act.done ? colors.text : "text-gray-600"}`}>
                  {act.label}
                </div>
                {(act as any).sub && (
                  <div className="text-xs text-gray-400 mt-0.5">{(act as any).sub}</div>
                )}
              </div>
              {act.type === "audio" && (
                <div className={`p-1.5 rounded-lg ${act.done ? colors.bg : "bg-gray-50"}`}>
                  <Mic className={`w-4 h-4 ${act.done ? colors.text : "text-gray-300"}`} />
                </div>
              )}
              {act.type === "text" && !act.done && (
                <div className="p-1.5 rounded-lg bg-gray-50">
                  <FileText className="w-4 h-4 text-gray-300" />
                </div>
              )}
              {!act.done && act.type === "check" && (
                <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
              )}
            </div>
          );
        })}

        <div className="py-2 text-center">
          <span className="text-xs text-gray-400">✦ Semangat terus, Aisyah! ✦</span>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="bg-white border-t border-gray-100 px-6 py-2 flex justify-around">
        {[
          { icon: CheckCircle2, label: "Harian", active: true },
          { icon: Calendar, label: "Kalender", active: false },
          { icon: TrendingUp, label: "Progress", active: false },
          { icon: Settings, label: "Pengaturan", active: false },
        ].map(({ icon: Icon, label, active }) => (
          <button key={label} className={`flex flex-col items-center gap-0.5 py-1 ${active ? "text-emerald-600" : "text-gray-400"}`}>
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
