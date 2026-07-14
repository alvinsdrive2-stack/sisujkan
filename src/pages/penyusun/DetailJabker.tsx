import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Phone, Mail, Hash, UserPlus, Briefcase } from "lucide-react"

interface PraktisiItem {
  id: number
  id_jabatan_kerja: string
  id_user: number
  user: {
    id: number
    name: string
    email: string
    phone: string
    noreg: string
  }
  jabatan_kerja: {
    id_jabatan_kerja: string
    jabatan_kerja: string
  }
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ))}
    </div>
  )
}

export default function DetailJabker() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [jabkerName, setJabkerName] = useState("")
  const [praktisiList, setPraktisiList] = useState<PraktisiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const token = localStorage.getItem("access_token") || ""

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [jabkerRes, praktisiRes] = await Promise.all([
        fetch(`${API_BASE_URL}/penyusun/jabker`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/kan/config/praktisi-by-jabatan/${id}?all=true`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        }),
      ])

      if (jabkerRes.ok) {
        const j = await jabkerRes.json()
        const data = j.data || j
        if (Array.isArray(data)) {
          const found = data.find((x: any) => String(x.id) === id || x.id_jabatan_kerja === id)
          setJabkerName(found?.nama || found?.jabatan_kerja || found?.name || id || "")
        }
      }

      if (praktisiRes.ok) {
        const j = await praktisiRes.json()
        const data = j.data || j
        setPraktisiList(Array.isArray(data) ? data : [])
      } else {
        setPraktisiList([])
      }
    } catch (err: any) {
      setError(err.message || "Gagal load data")
    }
    setLoading(false)
  }

  const praktisiCount = praktisiList.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/penyusun/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Detail Jabatan Kerja</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">{id}</Badge>
            {jabkerName && <span className="font-medium text-slate-700 dark:text-slate-300">{jabkerName}</span>}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Side by Side: Praktisi List (70%) + Quick Actions (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left: Praktisi List - 70% */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Daftar Praktisi
              <span className="ml-auto text-sm font-normal text-slate-500">Total: {loading ? "..." : praktisiCount}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} />
            ) : !error && praktisiList.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 mb-1">Belum ada praktisi di jabker ini</p>
                <p className="text-xs text-slate-400 mb-4">Assign praktisi dulu lewat menu Assign Praktisi</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/penyusun/assign-praktisi")}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Praktisi
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {praktisiList.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/praktisi/kerja/${p.id_user}`)}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{idx + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200">{p.user?.name || "-"}</h4>
                          <p className="text-xs text-slate-500">ID User: {p.id_user}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {p.user?.noreg || "N/A"}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {p.user?.email || "-"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {p.user?.phone || "-"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        ID: {p.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Quick Actions - 30% */}
        <div className="lg:col-span-3 space-y-4">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Informasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">ID Jabatan Kerja</p>
                <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{id}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Nama Jabker</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{jabkerName || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Total Praktisi</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{praktisiCount} orang</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Aksi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="default"
                className="w-full"
                onClick={() => navigate("/penyusun/assign-praktisi")}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Praktisi
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/penyusun/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
