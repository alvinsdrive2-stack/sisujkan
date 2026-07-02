export default function DashboardPenyusun() {
  const jabkerList = [
    { id: 1, nama: "Teknisi Muda Listrik", skema: 3, status: "Aktif" },
    { id: 2, nama: "Analis Sistem Informasi", skema: 5, status: "Aktif" },
    { id: 3, nama: "Teknisi Laboratorium", skema: 2, status: "Aktif" },
    { id: 4, nama: "Administrator Perkantoran", skema: 4, status: "Nonaktif" },
    { id: 5, nama: "Ahli K3 Muda", skema: 2, status: "Aktif" },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard Penyusun</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Daftar Jabatan Kerja (Jabker)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Jabker</p>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">5</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Total Skema</p>
          <p className="text-3xl font-bold text-green-800 dark:text-green-200">16</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400">Soal Tersimpan</p>
          <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">124</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-600">
              <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Nama Jabker</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Jumlah Skema</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {jabkerList.map((j) => (
              <tr key={j.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{j.nama}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{j.skema}</td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    j.status === "Aktif"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  }`}>
                    {j.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs">
                    Lihat Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
