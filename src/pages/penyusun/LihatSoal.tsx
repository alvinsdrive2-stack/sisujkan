import { useState } from "react"

export default function LihatSoal() {
  const [selectedJabker, setSelectedJabker] = useState("")
  const [selectedDokumen, setSelectedDokumen] = useState("")

  const previewData = [
    { no: 1, soal: "Jelaskan prosedur instalasi...", unit: "U.K.01", kuk: "KUK-01", a: "", b: "", c: "", d: "", jawaban: "" },
    { no: 2, soal: "Sebutkan alat yang digunakan...", unit: "U.K.01", kuk: "KUK-02", a: "", b: "", c: "", d: "", jawaban: "" },
    { no: 3, soal: "Apa langkah pertama...", unit: "U.K.02", kuk: "KUK-01", a: "", b: "", c: "", d: "", jawaban: "" },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Lihat Soal</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Input, edit, dan kelola soal KAN</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Jabatan Kerja</label>
          <select
            value={selectedJabker}
            onChange={(e) => setSelectedJabker(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">-- Pilih Jabker --</option>
            <option value="1">Teknisi Muda Listrik</option>
            <option value="2">Analis Sistem Informasi</option>
            <option value="3">Ahli K3 Muda</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Dokumen KAN</label>
          <select
            value={selectedDokumen}
            onChange={(e) => setSelectedDokumen(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">-- Pilih Dokumen --</option>
            <option value="ia04b">IA.04B — Lembar Periksa Kegiatan Terstruktur</option>
            <option value="ia05">IA.05 — Pertanyaan Pilihan Ganda</option>
            <option value="ia06">IA.06 — Pertanyaan Esai</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Extract Soal dari Word
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
            + Tambah Manual
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari soal..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
          />
        </div>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Filter
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 w-12">No</th>
              <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Soal</th>
              <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Unit</th>
              <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">KUK</th>
              <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {previewData.map((row) => (
              <tr key={row.no} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{row.no}</td>
                <td className="py-2 px-3 text-slate-700 dark:text-slate-200">
                  <textarea
                    defaultValue={row.soal}
                    className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-sm resize-none"
                    rows={2}
                  />
                </td>
                <td className="py-2 px-3">
                  <select className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-700 dark:text-slate-200">
                    <option>{row.unit}</option>
                  </select>
                </td>
                <td className="py-2 px-3">
                  <select className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-700 dark:text-slate-200">
                    <option>{row.kuk}</option>
                  </select>
                </td>
                <td className="py-2 px-3">
                  <button className="text-red-500 hover:text-red-700 text-xs font-medium">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-6 py-2 rounded-lg text-sm font-medium">
          Batal
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium">
          Simpan ke Backend
        </button>
      </div>
    </div>
  )
}
