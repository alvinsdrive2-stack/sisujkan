import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"

export default function MukResult() {
  const { idIzin } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!idIzin) return
    setLoading(true)
    fetch(`${API_BASE_URL}/penyusun/${idIzin}/muk`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
    })
      .then(r => { if (!r.ok) throw new Error("Gagal fetch MUK"); return r.json() })
      .then(j => setData(j.data || j))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false))
  }, [idIzin])

  if (loading) return <div className="p-12 text-center text-slate-400">Memuat data MUK...</div>
  if (error) return <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>
  if (!data) return <div className="p-12 text-center text-slate-400">Data tidak ditemukan</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Hasil MUK</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Lihat hasil MUK participant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Nama Peserta</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{data.nama || data.nama_peserta || "-"}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Skema</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{data.skema || data.nama_skema || "-"}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Status TTD</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{data.status_ttd || data.ttd_status || "Belum"}</p>
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-6 overflow-x-auto">
        {data.units || data.unit_kompetensi ? (
          <div className="space-y-4">
            {(data.units || data.unit_kompetensi || []).map((unit: any, i: number) => (
              <div key={i} className="border border-slate-100 dark:border-slate-700 rounded-lg p-3">
                <h4 className="font-medium text-sm text-slate-700 dark:text-slate-200 mb-2">{unit.kode || unit.kode_unit} — {unit.nama || unit.nama_unit}</h4>
                {unit.kuks && Array.isArray(unit.kuks) && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700">
                        <th className="text-left py-1 px-2 text-slate-500">KUK</th>
                        <th className="text-center py-1 px-2 text-slate-500">Observasi</th>
                        <th className="text-center py-1 px-2 text-slate-500">Portofolio</th>
                        <th className="text-center py-1 px-2 text-slate-500">Lisan</th>
                        <th className="text-center py-1 px-2 text-slate-500">Tertulis</th>
                        <th className="text-center py-1 px-2 text-slate-500">Wawancara</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unit.kuks.map((kuk: any, j: number) => (
                        <tr key={j} className="border-b border-slate-50 dark:border-slate-700/50">
                          <td className="py-1 px-2 text-slate-600 dark:text-slate-300">{kuk.kode || kuk.nama || kuk.id}</td>
                          <td className="py-1 px-2 text-center">{kuk.observasi ? "✅" : "❌"}</td>
                          <td className="py-1 px-2 text-center">{kuk.portofolio ? "✅" : "❌"}</td>
                          <td className="py-1 px-2 text-center">{kuk.pertanyaan_lisan ? "✅" : "❌"}</td>
                          <td className="py-1 px-2 text-center">{kuk.pertanyaan_tertulis ? "✅" : "❌"}</td>
                          <td className="py-1 px-2 text-center">{kuk.wawancara ? "✅" : "❌"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-8">Data MUK akan ditampilkan di sini</p>
        )}
      </div>
    </div>
  )
}
