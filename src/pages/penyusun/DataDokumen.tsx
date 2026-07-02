export default function DataDokumen() {
  const dokumenList = [
    { id: 1, nama: "IA.04B - Teknisi Listrik", tipe: "Lembar Periksa", jabker: "Teknisi Muda Listrik", tgl: "2026-06-28", status: "Tersimpan" },
    { id: 2, nama: "IA.05 - Analis SI", tipe: "Pilihan Ganda", jabker: "Analis Sistem Informasi", tgl: "2026-06-25", status: "Tersimpan" },
    { id: 3, nama: "IA.06 - Ahli K3", tipe: "Esai", jabker: "Ahli K3 Muda", tgl: "2026-06-20", status: "Draft" },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Data Dokumen</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Dokumen-dokumen terkait soal KAN</p>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Nama Dokumen</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Tipe</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Jabker</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Tanggal</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {dokumenList.map((d) => (
              <tr key={d.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="py-3 px-4 text-slate-700 dark:text-slate-200 font-medium">{d.nama}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{d.tipe}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{d.jabker}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{d.tgl}</td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    d.status === "Tersimpan"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}>
                    {d.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-medium">
                    Download
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
