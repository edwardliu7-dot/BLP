import {
  Users,
  BarChart3,
  Bell,
  LogOut,
  ChevronRight,
  Search,
  Eye,
  MessageCircle,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Presentation,
  Download,
  FileSpreadsheet,
  MoreVertical,
} from "lucide-react";

const students = [
  { name: "Aisyah Rahmawati", score: 87, progress: 18, total: 21, status: "Selesai" },
  { name: "Budi Santoso", score: 73, progress: 15, total: 21, status: "Proses" },
  { name: "Citra Dewi", score: 95, progress: 21, total: 21, status: "Selesai" },
  { name: "Dimas Prakasa", score: 60, progress: 12, total: 21, status: "Belum" },
  { name: "Elfira Nadia", score: 82, progress: 17, total: 21, status: "Proses" },
  { name: "Fajar Hidayat", score: 91, progress: 20, total: 21, status: "Selesai" },
];

const scoreColor = (s: number) =>
  s >= 85 ? "text-emerald-600" : s >= 70 ? "text-amber-500" : "text-red-500";

const statusBadge: Record<string, string> = {
  Selesai: "bg-emerald-100 text-emerald-700",
  Proses: "bg-amber-100 text-amber-700",
  Belum: "bg-red-100 text-red-600",
};

export function Mobile() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans max-w-sm mx-auto flex flex-col">
      {/* Status bar */}
      <div className="bg-emerald-700 px-4 pt-2 pb-0 flex justify-between items-center text-white text-xs">
        <span>09:41</span>
        <span className="flex gap-1">▂▄▆ ✦ 🔋</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-700 to-emerald-600 px-4 pt-3 pb-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">B</div>
            <div>
              <div className="font-bold text-sm leading-tight">BLP Harian</div>
              <div className="text-xs text-emerald-200">SMP TISA</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 bg-white/10 rounded-xl">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">SD</div>
          </div>
        </div>

        <div className="text-xs text-emerald-100 mb-1">Selamat pagi, Ustazah Sari 👋</div>
        <div className="text-lg font-bold">Kelas 7A — Sabtu, 26 Juli</div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Sudah Isi", value: "21", color: "bg-emerald-500/30" },
            { label: "Rata-rata", value: "78.4", color: "bg-teal-500/30" },
            { label: "Belum Isi", value: "7", color: "bg-red-400/30" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} backdrop-blur rounded-xl px-3 py-2.5 text-center`}>
              <div className="text-lg font-bold text-white">{value}</div>
              <div className="text-xs text-emerald-100 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav tabs */}
      <div className="bg-white border-b border-gray-100 px-2 flex gap-1 sticky top-0 z-10">
        {[
          { icon: Users, label: "Siswa", active: true },
          { icon: BarChart3, label: "Rekap", active: false },
          { icon: Calendar, label: "Hari Aktif", active: false },
        ].map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs font-medium border-b-2 transition gap-1 ${
              active ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-400"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Search + actions */}
      <div className="px-4 py-3 bg-white shadow-sm">
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Cari nama siswa..." />
        </div>
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 text-white py-2 rounded-xl text-xs font-semibold">
            <Bell className="w-3.5 h-3.5" />
            Ingatkan Semua
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2 rounded-xl text-xs font-semibold">
            <Presentation className="w-3.5 h-3.5" />
            Presentasi
          </button>
        </div>
      </div>

      {/* Student list */}
      <div className="flex-1 px-4 py-3 space-y-2">
        {students.map((s, i) => (
          <div key={s.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800 truncate">{s.name}</span>
                  <span className={`text-base font-bold ${scoreColor(s.score)}`}>{s.score}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{ width: `${(s.progress / s.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{s.progress}/{s.total}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge[s.status]}`}>
                    {s.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 ml-2">
                <button className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 rounded-lg bg-green-50 text-green-600"><MessageCircle className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        <div className="text-center py-4">
          <button className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mx-auto">
            Lihat semua 28 siswa <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="bg-white border-t border-gray-100 px-6 py-2 flex justify-around safe-area-bottom">
        {[
          { icon: Users, label: "Siswa", active: true },
          { icon: BarChart3, label: "Rekap", active: false },
          { icon: Bell, label: "Notif", active: false },
          { icon: LogOut, label: "Keluar", active: false },
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
