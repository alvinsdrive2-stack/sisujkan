import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PenTool, FileText, Calendar, User, Clock, CheckCircle2, Search } from "lucide-react"
import { DocumentCard, EmptyState } from "@/components/direktur"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { Pagination } from "@/components/ui/Pagination"
import { useKegiatanDirektur } from "@/hooks/useKegiatan"
import { getUniqueSkemaNames } from "@/lib/kegiatan-service"
import { jenisKelasLabel } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

export default function TandatanganDirektur() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { kegiatans: pendingDocs, isLoading: isLoadingPending, pagination } = useKegiatanDirektur(false, page, search)
  const { isLoading: isLoadingSigned } = useKegiatanDirektur(true)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const isLoading = isLoadingPending || isLoadingSigned

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
            {isLoadingPending && <SimpleSpinner size="sm" className="ml-2 text-primary" />}
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
                    { icon: FileText, label: "TUK", value: doc.tuk?.nama?.toUpperCase() || '-' },
                    { icon: Calendar, label: "Tanggal", value: formatDate(doc.tanggal_uji) },
                    { icon: Clock, label: "Waktu", value: formatTime(doc.tanggal_uji) }
                  ]}
                  badges={[<Badge key="status" className="bg-amber-100 text-amber-700">Menunggu</Badge>]}
                  onClick={() => navigate(`/direktur/belum-ditandatangani/${doc.jadwal_id}`)}
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
