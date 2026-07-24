import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, BookOpen, Loader2 } from "lucide-react"

type DocType = "ia04b" | "ia05" | "ia06"

interface SoalKosongPreviewProps {
  jabkerId: string
  className?: string
}

const DOKEMEN_META: Record<DocType, { label: string; desc: string }> = {
  ia04b: { label: "FR.IA.04.B", desc: "Lembar Periksa Kegiatan Terstruktur" },
  ia05: { label: "FR.IA.05", desc: "Pertanyaan Pilihan Ganda" },
  ia06: { label: "FR.IA.06", desc: "Pertanyaan Esai" },
}

type SoalRow = Record<string, any>

function SoalTable({ data, jenis }: { data: SoalRow[]; jenis: DocType }) {
  if (data.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
        <p className="text-slate-400 text-sm">Tidak ada soal untuk {DOKEMEN_META[jenis].label}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-700">
          <tr>
            <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 w-12">No</th>
            <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">Soal</th>
            {jenis === "ia04b" && (
              <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">Lingkup</th>
            )}
            {jenis === "ia04b" && (
              <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">Kode Unit</th>
            )}
            {jenis === "ia05" && (
              <>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[120px]">A</th>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[120px]">B</th>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[120px]">C</th>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[120px]">D</th>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">KUK</th>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 w-20">Jawaban</th>
              </>
            )}
            {jenis === "ia06" && (
              <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">KUK</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t border-slate-100 dark:border-slate-700">
              <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-xs align-top">{row.no ?? row.no_soal ?? idx + 1}</td>
              <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-xs align-top whitespace-pre-wrap">{row.soal || "-"}</td>
              {jenis === "ia04b" && (
                <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-xs align-top">{row.soal1 || row.lingkup || "-"}</td>
              )}
              {jenis === "ia04b" && (
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-xs align-top font-mono">{row.kode_unit || row.unit?.kode || "-"}</td>
              )}
              {jenis === "ia05" && (
                <>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-xs align-top whitespace-pre-wrap">{row.jawab_a || "-"}</td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-xs align-top whitespace-pre-wrap">{row.jawab_b || "-"}</td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-xs align-top whitespace-pre-wrap">{row.jawab_c || "-"}</td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-xs align-top whitespace-pre-wrap">{row.jawab_d || "-"}</td>
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-xs align-top font-mono">{row.kode_kuk || row.kuk?.kode || "-"}</td>
                  <td className="py-2 px-3 text-xs align-top">
                    <Badge variant={row.jawaban ? "default" : "outline"} className="text-xs">
                      {row.jawaban || "-"}
                    </Badge>
                  </td>
                </>
              )}
              {jenis === "ia06" && (
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-xs align-top font-mono">{row.kode_kuk || row.kuk?.kode || "-"}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SoalKosongPreview({ jabkerId }: SoalKosongPreviewProps) {
  const [activeTab, setActiveTab] = useState<DocType>("ia04b")
  const [data, setData] = useState<Record<DocType, SoalRow[]>>({ ia04b: [], ia05: [], ia06: [] })
  const [loading, setLoading] = useState<Record<DocType, boolean>>({ ia04b: true, ia05: true, ia06: true })
  const [errors, setErrors] = useState<Record<DocType, string>>({ ia04b: "", ia05: "", ia06: "" })

  const token = localStorage.getItem("access_token") || ""

  useEffect(() => {
    ;(["ia04b", "ia05", "ia06"] as DocType[]).forEach((jenis) => fetchSoal(jenis))
  }, [jabkerId])

  const fetchSoal = async (jenis: DocType) => {
    setLoading((prev) => ({ ...prev, [jenis]: true }))
    setErrors((prev) => ({ ...prev, [jenis]: "" }))
    try {
      const res = await fetch(`${API_BASE_URL}/kan/config/soal-kosong/${jabkerId}/${jenis}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Gagal load (${res.status})`)
      const json = await res.json()
      const rows = json.data?.soal || json.data || json.soal || []
      setData((prev) => ({ ...prev, [jenis]: Array.isArray(rows) ? rows : [] }))
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [jenis]: err.message || "Gagal fetch" }))
    }
    setLoading((prev) => ({ ...prev, [jenis]: false }))
  }

  const meta = DOKEMEN_META[activeTab]
  const currentData = data[activeTab]
  const currentLoading = loading[activeTab]
  const currentError = errors[activeTab]

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        {(Object.entries(DOKEMEN_META) as [DocType, typeof meta][]).map(([key, m]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            {m.label}
            <Badge variant={activeTab === key ? "default" : "outline"} className="text-xs ml-1">
              {data[key].length}
            </Badge>
          </button>
        ))}
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4 text-primary" />
            {meta.label} — {meta.desc}
            <span className="ml-auto text-sm font-normal text-slate-500">{currentData.length} Soal</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Memuat soal...</span>
            </div>
          ) : currentError ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {currentError}
            </div>
          ) : (
            <SoalTable data={currentData} jenis={activeTab} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
