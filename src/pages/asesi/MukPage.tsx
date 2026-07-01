import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import AsesiLayout from "@/components/AsesiLayout"
import { ActionButton } from "@/components/ui/ActionButton"
import { getMukSteps } from "@/lib/asesmen-steps"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { FullPageLoader } from "@/components/ui/loading-spinner"

export default function MukPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { idIzin } = useParams<{ idIzin: string }>()
  const { tahap, metode, jenjang } = useDataDokumenPraAsesmen(idIzin)
  const isAsesi = user?.role?.id !== RoleId.ASESOR

  const mukTitle = metode?.toLowerCase() === 'portofolio' ? 'MUK Portofolio' : 'MUK Observasi'

  if (!idIzin) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <AsesmenBreadcrumb currentPage="MUK" />

      <AsesiLayout currentStep={3} idIzin={idIzin} tahap={tahap}>
        <div style={{ padding: '20px' }}>
          {/* Title */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', marginBottom: '8px', textTransform: 'uppercase' }}>
              {mukTitle}
            </h2>
            <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
              {isAsesi
                ? "Sesi MUK (Materi Uji Kompetensi) merupakan tahap penetapan pemenuhan kompetensi melalui observasi/portofolio. Silakan selesaikan setiap langkah di bawah ini secara berurutan."
                : "Sesi MUK (Materi Uji Kompetensi) merupakan tahap penetapan pemenuhan kompetensi. Anda dapat memantau dan memverifikasi setiap langkah."}
            </p>
          </div>

          {/* Steps List */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '24px', overflow: 'hidden' }}>
            {getMukSteps(tahap, jenjang, metode).map((step, idx) => {
              const steps = getMukSteps(tahap, jenjang, metode)
              return (
              <div
                key={step.number}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  borderBottom: idx < steps.length - 1 ? '1px solid #e5e7eb' : 'none',
                  background: idx % 2 === 0 ? '#fff' : '#f9fafb',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#0066cc',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  flexShrink: 0,
                }}>
                  {step.number}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{step.label}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{step.label === 'MAPA 01' ? 'Perencanaan Asesmen' : step.label === 'MAPA 02' ? 'Rencana Asesmen Lanjutan' : step.label === 'AK.07' ? 'Kesesuaian Rencana Asesmen' : step.label === 'AK.04' ? 'Banding Asesmen' : 'K3 Asesmen'}</div>
                </div>
              </div>
              )})}
          </div>

          {/* Start Button */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <ActionButton variant="secondary" onClick={() => navigate(-1)}>
              Kembali
            </ActionButton>
            <ActionButton variant="primary" onClick={() => navigate(`/asesi/praasesmen/${idIzin}/mapa01`)}>
              Mulai
            </ActionButton>
          </div>
        </div>
      </AsesiLayout>
    </div>
  )
}
