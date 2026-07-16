import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileSignature, CheckCircle2, Clock } from "lucide-react"

interface PraktisiItem {
  id: number
  user: { id: number; name: string; email: string; phone: string; noreg: string }
  ttd_status?: Record<string, boolean>
}

export default function PenyusunMapaTtd() {
  const { jabkerId, praktisiId, jenis } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem("access_token") || ""

  const docType = jenis === "mapa01" ? "MAPA01" : "MAPA02"
  const docLabel = jenis === "mapa01" ? "MAPA 01" : "MAPA 02"

  const [praktisi, setPraktisi] = useState<PraktisiItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [ttdLoading, setTtdLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!jabkerId || !praktisiId) return
    loadPraktisi()
  }, [jabkerId, praktisiId])

  const loadPraktisi = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/kan/config/praktisi-by-jabatan/${jabkerId}?all=true`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      const data = json.data || json
      if (Array.isArray(data)) {
        const found = data.find((p: any) => String(p.id) === String(praktisiId))
        setPraktisi(found || null)
      }
    } catch {
      setError("Gagal load data praktisi")
    }
    setLoading(false)
  }

  const sudahTtd = praktisi?.ttd_status?.[docType] === true

  const handleTtd = async () => {
    setTtdLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/penyusun/jabatan/${praktisiId}/${jenis}/ttd`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error("Gagal TTD")
      const json = await res.json()
      if (json.message === "Success") {
        setSuccess(true)
        setTimeout(() => navigate(`/penyusun/detail-jabker/${jabkerId}`), 1500)
      } else {
        throw new Error(json.message || "Gagal")
      }
    } catch (err: any) {
      setError(err.message || "Gagal TTD")
    }
    setTtdLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/penyusun/detail-jabker/${jabkerId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">TTD {docLabel}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tanda tangan dokumen {docLabel}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" />
            Informasi Praktisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-48" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-32" />
            </div>
          ) : !praktisi ? (
            <p className="text-slate-500">Praktisi tidak ditemukan</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Nama</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{praktisi.user?.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Dokumen</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{docLabel}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status TTD</p>
                {sudahTtd || success ? (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Sudah TTD
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Belum TTD
                  </Badge>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  onClick={handleTtd}
                  disabled={ttdLoading || sudahTtd || success}
                  className="w-full sm:w-auto"
                >
                  {ttdLoading ? "Memproses..." : sudahTtd || success ? "Sudah TTD" : `TTD ${docLabel}`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
