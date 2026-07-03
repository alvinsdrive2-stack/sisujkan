import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config/api"

export default function DataDokumen() {
  const [skemaList, setSkemaList] = useState<any[]>([])
  const [selectedSkema, setSelectedSkema] = useState("")
  const [pesertaList, setPesertaList] = useState<any[]>([])
  const [pesertaLoading, setPesertaLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`${API_BASE_URL}/penyusun/skema`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
    })
      .then(r => r.json())
      .then(j => {
        const d = j.data || j
        setSkemaList(Array.isArray(d) ? d : [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedSkema) { setPesertaList([]); return }
    setPesertaLoading(true)
    setError("")
    fetch(`${API_BASE_URL}/penyusun/skema/${selectedSkema}/peserta`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
    })
      .then(r => { if (!r.ok) throw new Error("Gagal ambil peserta"); return r.json() })
      .then(j => {
        const d = j.data || j
        setPesertaList(Array.isArray(d) ? d : [])
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setPesertaLoading(false))
  }, [selectedSkema])

  const statusBadge = (s: string | boolean | null | undefined) => {
    const v = s === true || s === "1" || s === "Terisi" || s === "Lengkap"
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
        v ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
      }`}>
        {v ? "Terisi" : "Belum"}
      </span>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Data Dokumen</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Status dokumen per praktisi</p>
      </div>

      <div className="mb-4 max-w-xs">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Skema</label>
        <select
          value={selectedSkema}
          onChange={(e) => setSelectedSkema(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="">-- Pilih Skema --</option>
          {skemaList.map((s: any) => (
            <option key={s.id} value={s.id}>{s.nama}</option>
          ))}
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      {pesertaLoading ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center"><p className="text-slate-400">Memuat peserta...</p></div>
      ) : !selectedSkema ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center"><p className="text-slate-400">Pilih skema untuk lihat peserta</p></div>
      ) : pesertaList.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center"><p className="text-slate-400">Belum ada peserta</p></div>
      ) : (
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
              {pesertaList.map((p: any) => (
                <tr key={p.id || p.id_izin} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">{p.nama || p.nama_peserta || p.user?.name || "-"}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-xs">{p.jabker || p.jabatan_kerja || p.skema || "-"}</td>
                  <td className="py-3 px-2 text-center">{statusBadge(p.ia04b_status)}</td>
                  <td className="py-3 px-2 text-center">{statusBadge(p.ia05_status)}</td>
                  <td className="py-3 px-2 text-center">{statusBadge(p.ia06_status)}</td>
                  <td className="py-3 px-3 text-center">
                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-medium whitespace-nowrap">Lihat Dokumen</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
