import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config/api"

interface Props {
  idIzin: string
  jenis: string
  rolePrefix: string
  title: string
  subtitle: string
}

export default function PenilaianForm({ idIzin, jenis, rolePrefix, title, subtitle }: Props) {
  const [data, setData] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [scores, setScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const token = localStorage.getItem("access_token") || ""
  const apiPath = `${rolePrefix}/${idIzin}/${jenis}`

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE_URL}/${apiPath}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error("Gagal fetch data"); return r.json() })
      .then(j => {
        const d = j.data || j
        setData(d)
        // Init scores & answers from existing data
        if (d.soal_list || d.soal) {
          const list = d.soal_list || d.soal
          if (Array.isArray(list)) {
            const initScores: Record<string, number> = {}
            const initAnswers: Record<string, string> = {}
            list.forEach((q: any, i: number) => {
              const key = q.id || q.soal_id || i
              if (q.skor != null) initScores[key] = q.skor
              initAnswers[key] = q.jawaban || q.jawaban_asesi || ""
            })
            setScores(initScores)
            setAnswers(initAnswers)
          }
        }
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false))
  }, [idIzin, jenis])

  const soalList: any[] = data?.soal_list || data?.soal || []

  const handleSubmit = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const payload = {
        answers: soalList.map((q: any, i: number) => {
          const key = q.id || q.soal_id || i
          const isRekomendasi = q.tipe === 3 || q.is_rekomendasi
          if (isRekomendasi) {
            return { soal_id: q.id, is_rekomendasi: true, rekomendasi: !!scores[key] }
          }
          return {
            soal_id: q.id,
            jawaban: answers[key] || q.jawaban || "",
            skor: scores[key] ?? q.skor ?? 0,
          }
        }),
      }

      const res = await fetch(`${API_BASE_URL}/${apiPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || `Gagal simpan (${res.status})`)
      }

      setSuccess("Penilaian berhasil disimpan")
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-12 text-center text-slate-400">Memuat data penilaian...</div>
  if (error && !data) return <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-600">{success}</div>}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Nama Asesi</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{data?.asesi?.nama || data?.nama || data?.nama_peserta || idIzin}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Dokumen</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{data?.dokumen?.nama_dokumen || jenis.toUpperCase()}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Skor</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">{data?.total_skor ?? "-"}</p>
        </div>
      </div>

      {/* Questions */}
      {soalList.length === 0 ? (
        <div className="border border-slate-200 rounded-lg p-6">
          <p className="text-slate-400 text-center py-8">Belum ada soal atau jawaban</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg mb-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 w-12">No</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Soal</th>
                {jenis === "ia05" && <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[100px]">Kunci</th>}
                <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">Jawaban Asesi</th>
                <th className="text-center py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 w-24">Skor</th>
              </tr>
            </thead>
            <tbody>
              {soalList.map((q: any, i: number) => {
                const key = q.id || q.soal_id || i
                const isRekomendasi = q.tipe === 3 || q.is_rekomendasi
                const currentScore = scores[key] ?? q.skor ?? 0

                return (
                  <tr key={key} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-2 px-3 text-slate-600">{q.no || i + 1}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-200">
                      {isRekomendasi ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Rekomendasi</span>
                      ) : (q.soal || "-")}
                    </td>
                    {jenis === "ia05" && (
                      <td className="py-2 px-3 text-slate-600">
                        <span className="font-mono font-bold">{q.jawaban || "-"}</span>
                      </td>
                    )}
                    <td className="py-2 px-3">
                      {isRekomendasi ? (
                        <select
                          value={currentScore ? "1" : "0"}
                          onChange={(e) => setScores(prev => ({ ...prev, [key]: e.target.value === "1" ? 1 : 0 }))}
                          className="rounded border border-slate-300 px-2 py-1 text-xs bg-white dark:bg-slate-700"
                        >
                          <option value="0">Tidak</option>
                          <option value="1">Ya</option>
                        </select>
                      ) : (
                        <textarea
                          value={answers[key] || ""}
                          onChange={(e) => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-xs resize-none"
                          rows={2}
                          placeholder="Jawaban asesi..."
                        />
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {isRekomendasi ? (
                        <span className="text-xs text-slate-400">-</span>
                      ) : (
                        <select
                          value={currentScore}
                          onChange={(e) => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          className="rounded border border-slate-300 px-2 py-1 text-xs bg-white dark:bg-slate-700"
                        >
                          {jenis === "ia05" ? (
                            <>
                              <option value={0}>0</option>
                              <option value={1}>1</option>
                            </>
                          ) : (
                            <>
                              <option value={0}>0</option>
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                            </>
                          )}
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {soalList.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            {saving ? "Menyimpan..." : "Simpan Penilaian"}
          </button>
        </div>
      )}
    </div>
  )
}
