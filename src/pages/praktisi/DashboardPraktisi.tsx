export default function DashboardPraktisi() {
  const assignedJabker = [
    { id: 1, nama: "Teknisi Muda Listrik", skema: "Skema Sertifikasi Teknisi Listrik", progress: "Belum mulai" },
    { id: 2, nama: "Analis Sistem Informasi", skema: "Skema Sertifikasi Analis SI", progress: "APL.01" },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard Praktisi</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Jabatan Kerja yang diassign ke Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Assign Aktif</p>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">2</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Selesai</p>
          <p className="text-3xl font-bold text-green-800 dark:text-green-200">0</p>
        </div>
      </div>

      <div className="space-y-4">
        {assignedJabker.map((j) => (
          <div key={j.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{j.nama}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{j.skema}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {j.progress}
                </span>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Mulai / Lanjutkan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
