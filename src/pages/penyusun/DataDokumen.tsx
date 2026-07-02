import { useState } from "react"

export default function DataDokumen() {
  const [selectedPraktisi, setSelectedPraktisi] = useState("")

  const praktisiList = [
    { id: 1, nama: "Budi Santoso", jabker: "Teknisi Muda Listrik", skema: "Skema Sertifikasi Teknisi Listrik" },
    { id: 2, nama: "Siti Rahma", jabker: "Analis Sistem Informasi", skema: "Skema Sertifikasi Analis SI" },
    { id: 3, nama: "Ahmad Fauzi", jabker: "Ahli K3 Muda", skema: "Skema Ahli K3 Muda" },
  ]

  const dokumenPraktisi = selectedPraktisi ? [
    { nama: "APL.01", tipe: "Formulir Pendaftaran", tgl: "2026-06-28", status: "Lengkap" },
    { nama: "APL.02", tipe: "Asesmen Mandiri", tgl: "2026-06-28", status: "Lengkap" },
    { nama: "MUK", tipe: "Matrix Uji Kompetensi", tgl: "2026-06-29", status: "Lengkap" },
    { nama: "IA.04B", tipe: "Lembar Periksa", tgl: "2026-06-30", status: "Terisi" },
    { nama: "IA.05", tipe: "Pilihan Ganda", tgl: "2026-06-30", status: "Terisi" },
    { nama: "IA.06", tipe: "Esai", tgl: "2026-07-01", status: "Belum" },
  ] : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Data Dokumen</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Dokumen per praktisi/participant</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Praktisi</label>
        <select
          value={selectedPraktisi}
          onChange={(e) => setSelectedPraktisi(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="">-- Pilih Praktisi --</option>
          {praktisiList.map((p) => (
            <option key={p.id} value={p.id}>{p.nama} — {p.jabker}</option>
          ))}
        </select>
      </div>

      {selectedPraktisi && (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Dokumen</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Tipe</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Tanggal</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dokumenPraktisi.map((d, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-200 font-medium">{d.nama}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{d.tipe}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{d.tgl}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      d.status === "Lengkap" || d.status === "Terisi"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-medium">
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!selectedPraktisi && (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">Pilih praktisi untuk lihat dokumen</p>
        </div>
      )}
    </div>
  )
}
