import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Calendar, Save, AlertCircle } from "lucide-react"
import { kegiatanService, KegiatanAsesor } from "@/lib/kegiatan-service"
import { SimpleSpinner } from "@/components/ui/loading-spinner"

export default function EditJadwalPage() {
  const { jadwalId } = useParams<{ jadwalId: string }>()
  const navigate = useNavigate()
  const [kegiatan, setKegiatan] = useState<KegiatanAsesor | null>(null)
  const [loading, setLoading] = useState(true)
  const [tanggalUji, setTanggalUji] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchKegiatan = async () => {
      if (!jadwalId) return

      try {
        // Fetch dari yang belum ditandatangani
        const responseFalse = await kegiatanService.getKegiatanKomtek(false)
        let found = responseFalse.data.data.find((k: KegiatanAsesor) => k.jadwal_id === jadwalId)

        // Kalau ga ketemu, cari dari yang sudah ditandatangani
        if (!found) {
          const responseTrue = await kegiatanService.getKegiatanKomtek(true)
          found = responseTrue.data.data.find((k: KegiatanAsesor) => k.jadwal_id === jadwalId)
        }

        if (found) {
          setKegiatan(found)
          // Set initial date value from kegiatan
          const date = new Date(found.tanggal_uji)
          setTanggalUji(date.toISOString().split("T")[0])
        }
      } catch (err) {
        console.error("Error fetching kegiatan:", err)
        setError("Gagal memuat data jadwal")
      } finally {
        setLoading(false)
      }
    }
    fetchKegiatan()
  }, [jadwalId])

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jadwalId || !tanggalUji) return

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      await kegiatanService.updateJadwal(jadwalId, tanggalUji)
      setSuccess(true)
      setTimeout(() => {
        navigate(-1)
      }, 1500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memperbarui jadwal"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <SimpleSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Ubah Tanggal Uji
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Perbarui tanggal asesmen untuk jadwal ini
          </p>
        </div>
      </div>

      {/* Kegiatan Info */}
      {kegiatan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {kegiatan.skema.nama}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Asesor:</span>
                <span className="ml-2 font-medium">{kegiatan.asesor.nama}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">TUK:</span>
                <span className="ml-2 font-medium">{kegiatan.tuk.nama}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Tanggal Sekarang:</span>
                <span className="ml-2 font-medium text-primary">
                  {formatDateDisplay(kegiatan.tanggal_uji)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Perbarui Tanggal Uji</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="tanggalUji" className="text-sm font-medium text-slate-700 dark:text-slate-300">Tanggal Uji Baru</label>
              <Input
                id="tanggalUji"
                type="date"
                value={tanggalUji}
                onChange={(e) => setTanggalUji(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                Tanggal berhasil diperbarui! Mengalihkan...
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting || !tanggalUji}
                className="gap-2"
              >
                {submitting ? (
                  <SimpleSpinner size="sm" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
