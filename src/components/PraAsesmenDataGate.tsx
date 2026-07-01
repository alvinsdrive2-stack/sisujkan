import { useParams } from "react-router-dom"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { DokumenPraAsesmenCtx } from "@/contexts/AsesmenDataContext"
import { FullPageLoader } from "@/components/ui/loading-spinner"

interface PraAsesmenDataGateProps {
  children: React.ReactNode
}

export default function PraAsesmenDataGate({ children }: PraAsesmenDataGateProps) {
  const { idIzin } = useParams<{ idIzin?: string }>()

  const praData = useDataDokumenPraAsesmen(idIzin)

  if (praData.isLoading) {
    return <FullPageLoader text="Memuat data pra-asesmen..." />
  }

  return (
    <DokumenPraAsesmenCtx.Provider value={praData}>
      {children}
    </DokumenPraAsesmenCtx.Provider>
  )
}
