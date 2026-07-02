export default function DaftarSkema() {
  const skemaList = [
    { id: 1, nama: "Skema Sertifikasi Teknisi Listrik", jabker: "Teknisi Muda Listrik", total: 20, selesai: 12, progress: 60 },
    { id: 2, nama: "Skema Sertifikasi Analis SI", jabker: "Analis Sistem Informasi", total: 30, selesai: 18, progress: 60 },
    { id: 3, nama: "Skema Ahli K3 Muda", jabker: "Ahli K3 Muda", total: 15, selesai: 10, progress: 67 },
    { id: 4, nama: "Skema Teknisi Lab", jabker: "Teknisi Laboratorium", total: 8, selesai: 8, progress: 100 },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Daftar Skema</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Progress peserta per skema</p>
      </div>

      <div className="space-y-4">
        {skemaList.map((skema) => (
          <div key={skema.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{skema.nama}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{skema.jabker}</p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {skema.selesai}/{skema.total} peserta
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${skema.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">{skema.progress}% selesai</span>
              <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-medium">
                Lihat Detail
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
