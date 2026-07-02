export default function DataDokumen() {
  const praktisiList = [
    {
      id: 1, nama: "Budi Santoso", jabker: "Teknisi Muda Listrik",
      ia04b: "Terisi", ia05: "Terisi", ia06: "Belum"
    },
    {
      id: 2, nama: "Siti Rahma", jabker: "Analis Sistem Informasi",
      ia04b: "Terisi", ia05: "Belum", ia06: "Belum"
    },
    {
      id: 3, nama: "Ahmad Fauzi", jabker: "Ahli K3 Muda",
      ia04b: "Belum", ia05: "Belum", ia06: "Belum"
    },
  ]

  const statusBadge = (s: string) => {
    const color = s === "Lengkap" || s === "Terisi"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
    return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>{s}</span>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Data Dokumen</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Status dokumen per praktisi</p>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Praktisi</th>
              <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Jabker</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">IA.04B</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">IA.05</th>
              <th className="text-center py-3 px-2 font-semibold text-slate-600 dark:text-slate-300">IA.06</th>
              <th className="text-center py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {praktisiList.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">{p.nama}</td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-xs">{p.jabker}</td>
                <td className="py-3 px-2 text-center">{statusBadge(p.ia04b)}</td>
                <td className="py-3 px-2 text-center">{statusBadge(p.ia05)}</td>
                <td className="py-3 px-2 text-center">{statusBadge(p.ia06)}</td>
                <td className="py-3 px-3 text-center">
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-medium whitespace-nowrap">
                    Lihat Dokumen
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
