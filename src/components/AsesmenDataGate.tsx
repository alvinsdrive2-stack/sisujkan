import { useParams } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { DokumenAsesmenCtx, DokumenPraAsesmenCtx } from "@/contexts/AsesmenDataContext"
import { FullPageLoader } from "@/components/ui/loading-spinner"

interface AsesmenDataGateProps {
  children: React.ReactNode
}

export default function AsesmenDataGate({ children }: AsesmenDataGateProps) {
  const { id } = useParams<{ id?: string }>()
  const { user } = useAuth()

  const asesmenData = useDataDokumenAsesmen(id)
  const praData = useDataDokumenPraAsesmen(id)
  const { role: asesorRole } = useAsesorRole(id)

  const isAsesor = user?.role?.id === RoleId.ASESOR
  const roleResolved = !isAsesor || asesorRole !== "none"

  if (asesmenData.isLoading || praData.isLoading || !roleResolved) {
    return <FullPageLoader text="Memuat data asesmen..." />
  }

  return (
    <DokumenAsesmenCtx.Provider value={asesmenData}>
      <DokumenPraAsesmenCtx.Provider value={praData}>
        {children}
      </DokumenPraAsesmenCtx.Provider>
    </DokumenAsesmenCtx.Provider>
  )
}
