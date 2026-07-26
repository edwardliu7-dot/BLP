import {
  Users,
  BarChart3,
  Bell,
  LogOut,
  ChevronRight,
  Download,
  FileSpreadsheet,
  MessageCircle,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  Calendar,
  Search,
  Eye,
  Presentation,
} from "lucide-react";

const students = [
  { name: "Aisyah Rahmawati", score: 87, progress: "18/21", status: "Selesai", kelas: "7A" },
  { name: "Budi Santoso", score: 73, progress: "15/21", status: "Proses", kelas: "7A" },
  { name: "Citra Dewi", score: 95, progress: "21/21", status: "Selesai", kelas: "7A" },
  { name: "Dimas Prakasa", score: 60, progress: "12/21", status: "Belum", kelas: "7A" },
  { name: "Elfira Nadia", score: 82, progress: "17/21", status: "Proses", kelas: "7A" },
  { name: "Fajar Hidayat", score: 91, progress: "20/21", status: "Selesai", kelas: "7A" },
  { name: "Ghania Putri", score: 45, progress: "9/21", status: "Belum", kelas: "7A" },
  { name: "Haris Maulana", score: 78, progress: "16/21", status: "Proses", kelas: "7A" },
];

const recap = [
  { name: "Aisyah Rahmawati", jan: 85, feb: 87, mar: 89, avg: 87, days: 22 },
  { name: "Budi Santoso", jan: 70, feb: 73, mar: 71, avg: 71, days: 20 },
  { name: "Citra Dewi", jan: 93, feb: 95, mar: 94, avg: 94, days: 23 },
  { name: "Dimas Prakasa", jan: 62, feb: 60, mar: 65, avg: 62, days: 18 },
  { name: "Elfira Nadia", jan: 80, feb: 82, mar: 81, avg: 81, days: 21 },
];

const scoreColor = (s: number) =>
  s >= 85 ? "text-emerald-600" : s >= 70 ? "text-amber-500" : "text-red-500";

const scoreBg = (s: number) =>
  s >= 85 ? "bg-emerald-50 border-emerald-200" : s >= 70 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

const statusBadge: Record<string, string> = {
  Selesai: "bg-emerald-100 text-emerald-700",
  Proses: "bg-amber-100 text-amber-700",
  Belum: "bg-red-100 text-red-600",
};

export function Web() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-lg font-bold">B</span>
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">BLP Harian</div>
              <div className="text-xs text-emerald-100">SMP TISA Islamic School</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold">Ustazah Sari Dewi</div>
              <div className="text-xs text-emerald-100">Wali Kelas 7A</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">SD</div>
            <button className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition">
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {[
            { icon: Users, label: "Daftar Siswa", active: true },
            { icon: BarChart3, label: "Rekap Nilai", active: false },
            { icon: Calendar, label: "Hari Aktif", active: false },
          ].map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition ${
                active
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Siswa", value: "28", sub: "Kelas 7A", icon: Users, color: "emerald" },
            { label: "Sudah Isi Hari Ini", value: "21", sub: "75% dari total", icon: CheckCircle2, color: "teal" },
            { label: "Rata-rata Skor", value: "78.4", sub: "Hari ini", icon: TrendingUp, color: "amber" },
            { label: "Belum Isi", value: "7", sub: "Perlu diingatkan", icon: Bell, color: "red" },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-800">{value}</div>
                  <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Daftar Siswa — Sabtu, 26 Juli 2025</h2>
              <p className="text-xs text-gray-400 mt-0.5">Kelas 7A · 28 Siswa</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 w-52"
                  placeholder="Cari nama siswa..."
                />
              </div>
              <button className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm transition">
                <Bell className="w-4 h-4" />
                Ingatkan Semua
              </button>
              <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm transition">
                <Presentation className="w-4 h-4" />
                Presentasi
              </button>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-semibold">#</th>
                <th className="px-6 py-3 text-left font-semibold">Nama Siswa</th>
                <th className="px-6 py-3 text-center font-semibold">Progres Aktivitas</th>
                <th className="px-6 py-3 text-center font-semibold">Skor Hari Ini</th>
                <th className="px-6 py-3 text-center font-semibold">Status</th>
                <th className="px-6 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s, i) => (
                <tr key={s.name} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-xs">
                        {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-medium text-gray-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{s.progress}</span>
                      <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                          style={{ width: `${(parseInt(s.progress) / 21) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`inline-block font-bold text-base ${scoreColor(s.score)}`}>
                      {s.score}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Menampilkan 8 dari 28 siswa</span>
            <div className="flex gap-1">
              {[1,2,3].map(p => (
                <button key={p} className={`w-7 h-7 rounded-md text-xs font-medium ${p === 1 ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Rekap preview */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Rekap Nilai Bulanan</h2>
              <p className="text-xs text-gray-400 mt-0.5">Rata-rata per bulan · Juli 2025</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm transition">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Export Excel
              </button>
              <button className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm transition">
                <Download className="w-4 h-4 text-red-500" />
                Export PDF
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-semibold">Nama Siswa</th>
                {["Jan", "Feb", "Mar"].map(m => <th key={m} className="px-4 py-3 text-center font-semibold">{m}</th>)}
                <th className="px-4 py-3 text-center font-semibold">Rata-rata</th>
                <th className="px-4 py-3 text-center font-semibold">Hari Aktif</th>
                <th className="px-4 py-3 text-center font-semibold">Laporan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recap.map(r => (
                <tr key={r.name} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 font-medium text-gray-700">{r.name}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{r.jan}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{r.feb}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{r.mar}</td>
                  <td className={`px-4 py-3 text-center font-bold ${scoreColor(r.avg)}`}>{r.avg}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{r.days}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500 transition"><Download className="w-3.5 h-3.5" /></button>
                      <button className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-600 transition"><FileSpreadsheet className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
