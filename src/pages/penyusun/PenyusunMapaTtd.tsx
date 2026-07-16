import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileSignature, CheckCircle2, Clock, FileText } from "lucide-react"

export default function PenyusunMapaTtd() {
  const { jabkerId, jenis } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem("access_token") || ""

  const docType = jenis === "mapa01" ? "MAPA01_JABKER" : "MAPA02_JABKER"
  const docLabel = jenis === "mapa01" ? "MAPA 01" : "MAPA 02"
  const docTitle = jenis === "mapa01" ? "FR. MAPA.01 - FORMULIR MAPA 01" : "FR. MAPA.02 - FORMULIR MAPA 02"

  const [jabkerName, setJabkerName] = useState("")
  const [ttdStatus, setTtdStatus] = useState<{ sudah: boolean; url_image?: string; tanggal?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [ttdLoading, setTtdLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!jabkerId) return
    loadData()
  }, [jabkerId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch jabker name + check TTD status
      const [jabkerRes, ttdRes] = await Promise.all([
        fetch(`${API_BASE_URL}/penyusun/jabker`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/penyusun/jabker/${jabkerId}/${jenis}/status`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        }),
      ])

      if (jabkerRes.ok) {
        const j = await jabkerRes.json()
        const data = j.data || j
        if (Array.isArray(data)) {
          const found = data.find((x: any) => x.id_jabatan_kerja === jabkerId)
          setJabkerName(found?.jabatan_kerja || found?.nama || "")
        }
      }

      if (ttdRes.ok) {
        const t = await ttdRes.json()
        if (t.data) setTtdStatus(t.data)
      } else if (ttdRes.status === 404) {
        setTtdStatus({ sudah: false })
      }
    } catch {
      setError("Gagal load data")
    }
    setLoading(false)
  }

  const sudahTtd = ttdStatus?.sudah || success

  const handleTtd = async () => {
    setTtdLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/penyusun/jabker/${jabkerId}/${jenis}/ttd`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error("Gagal TTD")
      const json = await res.json()
      if (json.message === "Success") {
        setSuccess(true)
        setTtdStatus({ sudah: true, url_image: json.data?.url_image, tanggal: json.data?.tanggal })
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{docLabel}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tanda tangan dokumen {docLabel}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {/* Document Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-primary" />
            {docTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Jabatan Kerja</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{jabkerName || jabkerId}</p>
                </div>
                <div>
                  <p className="text-slate-500">ID Jabker</p>
                  <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{jabkerId}</p>
                </div>
              </div>

              {/* TTD Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Tanda Tangan Penyusun</h3>
                <div className="flex items-center gap-4">
                  {sudahTtd && ttdStatus?.url_image ? (
                    <div className="text-center">
                      <img src={ttdStatus.url_image} alt="QR TTD" className="w-24 h-24 mx-auto border rounded" />
                      <p className="text-xs text-green-600 mt-1">
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                        Sudah TTD{ttdStatus.tanggal ? ` (${ttdStatus.tanggal})` : ""}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-sm px-3 py-1.5">
                      <Clock className="w-4 h-4 mr-1.5" />
                      Belum TTD
                    </Badge>
                  )}
                </div>

                <div className="mt-4">
                  <Button
                    onClick={handleTtd}
                    disabled={ttdLoading || sudahTtd}
                    size="lg"
                  >
                    {ttdLoading ? (
                      "Memproses..."
                    ) : sudahTtd ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Sudah TTD
                      </>
                    ) : (
                      <>
                        <FileSignature className="w-4 h-4 mr-2" />
                        TTD {docLabel}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
