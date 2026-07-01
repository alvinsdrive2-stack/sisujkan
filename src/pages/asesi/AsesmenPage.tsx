import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useTahapStepCheck } from "@/hooks/useTahapStepCheck"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { FullPageLoader } from "@/components/ui/loading-spinner"

export default function AsesmenPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { kegiatan, isLoading: kegiatanLoading } = useKegiatanByRole()

  const idIzin = kegiatan?.jadwal_id
  const { jenjang, metode } = useDataDokumenAsesmen(idIzin)

  // Auto-redirect to first step with empty QR (hook handles navigation internally)
  const { redirectStep: _redirectStep, isLoading: stepLoading } = useTahapStepCheck({
    tahap: 2,
    idIzin,
    replaceId: idIzin,
    jenjang,
    metode,
  })

  useEffect(() => {
    if (authLoading || kegiatanLoading || stepLoading) return
    if (!user || !kegiatan) return
    // Mark valid entry point
    sessionStorage.setItem('validNavigationEntry', 'true')
  }, [authLoading, kegiatanLoading, stepLoading, user, kegiatan, jenjang, metode])

  if (authLoading || kegiatanLoading || stepLoading || !jenjang) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <FullPageLoader text="Memeriksa status langkah..." />
      </div>
    )
  }

  return null
}
