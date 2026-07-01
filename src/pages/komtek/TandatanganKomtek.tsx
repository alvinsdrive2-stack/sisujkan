import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PenTool, FileText, Calendar, User, Clock, CheckCircle2, Search } from "lucide-react"
import { DocumentCard, EmptyState } from "@/components/direktur"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { Pagination } from "@/components/ui/Pagination"
import { useKegiatanKomtek } from "@/hooks/useKegiatan"
import { useBaKomtekProgress } from "@/hooks/useBaKomtekProgress"
import { getUniqueSkemaNames } from "@/lib/kegiatan-service"
import { jenisKelasLabel } from "@/lib/utils"

export default function TandatanganKomtek() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { kegiatans: pendingDocs, isLoading: isLoadingPending, pagination } = useKegiatanKomtek(false, page, search)
  const { isLoading: isLoadingSigned } = useKegiatanKomtek(true)
  const { baProgress, isLoading: isLoadingProgress } = useBaKomtekProgress(pendingDocs, pendingDocs.length > 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const isLoading = isLoadingPending || isLoadingSigned || isLoadingProgress

  const getStatusBadge = (jadwalId: string) => {
    const progress = baProgress[jadwalId]
    if (!progress) {
      return <Badge key="status" className="bg-slate-100 text-slate-700">Menunggu</Badge>
    }
    if (progress.my_ttd_signed) {
      return <Badge key="status" className="bg-emerald-100 text-emerald-700">Telah Selesai Ditandatangani</Badge>
    }
    return <Badge key="status" className="bg-amber-100 text-amber-700">Menunggu Tandatangan</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Tandatangan Dokumen</h2>
        <p className="text-slate-600">Daftar dokumen yang belum ditandatangani</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari kegiatan..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Documents to View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-primary" />
            Dokumen Perlu Tandatangan
            {isLoading && <SimpleSpinner size="sm" className="ml-2 text-primary" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading && pendingDocs.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Semua dokumen telah ditandatangani"
              description="Tidak ada dokumen yang menunggu tandatangan"
              iconClassName="text-emerald-500"
            />
          ) : (
            <div className="space-y-4">
              {pendingDocs.map((doc) => (
                <DocumentCard
                  key={doc.jadwal_id}
                  nomorKegiatan={doc.nama_kegiatan}
                  skemaSertifikasi={getUniqueSkemaNames(doc)}
                  jenisAsesmen={jenisKelasLabel(doc.jenis_kelas)}
                  documentInfo={[
                    { icon: User, label: "Asesor", value: `${doc.asesor?.nama?.toUpperCase() || ''}${doc.asesor2 ? ` & ${doc.asesor2.nama?.toUpperCase() || ''}` : ''}` || '-' },
                    { icon: FileText, label: "TUK", value: doc.tuk?.nama?.toUpperCase() || '' },
                    { icon: Calendar, label: "Tanggal", value: formatDate(doc.tanggal_uji) },
                    { icon: Clock, label: "Waktu", value: formatTime(doc.tanggal_uji) }
                  ]}
                  badges={[getStatusBadge(doc.jadwal_id)]}
                  onClick={() => navigate(`/komtek/belum-ditandatangani/${doc.jadwal_id}`)}
                />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            lastPage={pagination.lastPage}
            total={pagination.total}
            perPage={pagination.perPage}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
