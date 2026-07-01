import { useDokumenAsesiModal } from "@/contexts/DokumenAsesiContext"
import { FileText } from "lucide-react"
import { SimpleSpinner } from "@/components/ui/loading-spinner"

export default function DokumenAsesiModal() {
  const { isOpen, closeModal, loading, sptAsesor, verifikasiTuk } = useDokumenAsesiModal()

  if (!isOpen) return null

  return (
    <div
      onClick={closeModal}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px',
          maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Dokumen Asesi
          </h3>
          <button
            onClick={closeModal}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: '#6b7280', fontSize: '20px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <SimpleSpinner size="sm" />
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>Memuat dokumen...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <DocCard
                label="SPT Asesor"
                url={sptAsesor}
              />
              <DocCard
                label="Verifikasi TUK"
                url={verifikasiTuk}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DocCard({ label, url }: { label: string; url: string | null }) {
  return (
    <div style={{
      padding: '16px', borderRadius: '12px',
      border: `2px solid ${url ? '#10b981' : '#e5e7eb'}`,
      background: url ? '#f0fdf4' : '#f9fafb',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>{label}</p>
          <p style={{ fontSize: '12px', color: url ? '#059669' : '#9ca3af', margin: '4px 0 0 0' }}>
            {url ? 'Sudah dibuat' : 'Belum dibuat'}
          </p>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '6px 14px', background: '#10b981', color: '#fff',
              fontSize: '13px', fontWeight: '600', borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            <FileText style={{ width: '14px', height: '14px' }} />
            Lihat
          </a>
        )}
      </div>
    </div>
  )
}
