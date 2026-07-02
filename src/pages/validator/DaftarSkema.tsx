export default function DaftarSkemaValidator() {
  const skemaList = [
    { id: 1, nama: "Skema Sertifikasi Teknisi Listrik", jabker: "Teknisi Muda Listrik", soal: 45, reviewed: 30 },
    { id: 2, nama: "Skema Sertifikasi Analis SI", jabker: "Analis Sistem Informasi", soal: 60, reviewed: 60 },
    { id: 3, nama: "Skema Ahli K3 Muda", jabker: "Ahli K3 Muda", soal: 30, reviewed: 15 },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Daftar Skema</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Lihat soal dan penilaian penyusun</p>
      </div>

      <div className="space-y-4">
        {skemaList.map((skema) => (
          <div key={skema.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{skema.nama}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{skema.jabker}</p>
              </div>
              <span className="text-xs text-slate-400">
                {skema.reviewed}/{skema.soal} soal direview
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium">
                Lihat Soal
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium">
                Lihat Penilaian Penyusun
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
