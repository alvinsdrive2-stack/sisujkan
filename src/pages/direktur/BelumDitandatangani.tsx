import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, FileText, Calendar, User, Clock, Search } from "lucide-react"
import { DocumentCard, EmptyState } from "@/components/direktur"
import { useKegiatanDirektur } from "@/hooks/useKegiatan"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { Pagination } from "@/components/ui/Pagination"
import { getUniqueSkemaNames } from "@/lib/kegiatan-service"
import { jenisKelasLabel } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function BelumDitandatangani() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { kegiatans, isLoading, error, pagination } = useKegiatanDirektur(false, page, search)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Belum Ditandatangani</h2>
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

      {/* Unsigned Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Dokumen Belum Ditandatangani
            {isLoading && <SimpleSpinner size="sm" className="ml-2 text-amber-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8 text-red-500">
              Gagal memuat data: {error}
            </div>
          )}
          {!isLoading && !error && kegiatans.length === 0 && (
            <EmptyState
              icon={FileText}
              title="Tidak ada dokumen yang menunggu"
              description="Semua dokumen telah ditandatangani"
            />
          )}
          <div className="space-y-4">
            {kegiatans.map((doc) => (
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
                badges={[
                  <Badge key="status" variant="outline" className="border-amber-200 text-amber-700">Menunggu</Badge>
                ]}
                cardClassName="bg-amber-50/40"
                onClick={() => navigate(`/direktur/belum-ditandatangani/${doc.jadwal_id}`)}
              />
            ))}
          </div>

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
