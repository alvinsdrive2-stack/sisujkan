import { createContext, useContext, useState, ReactNode, useCallback } from "react"
import { API_BASE_URL } from "@/config/api"

interface DokumenAsesiContextType {
  isOpen: boolean
  loading: boolean
  sptAsesor: string | null
  verifikasiTuk: string | null
  openModal: (idIzin: string) => void
  closeModal: () => void
}

const DokumenAsesiContext = createContext<DokumenAsesiContextType | undefined>(undefined)

export function DokumenAsesiProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sptAsesor, setSptAsesor] = useState<string | null>(null)
  const [verifikasiTuk, setVerifikasiTuk] = useState<string | null>(null)

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setSptAsesor(null)
    setVerifikasiTuk(null)
  }, [])

  const openModal = useCallback(async (idIzin: string) => {
    setIsOpen(true)
    setLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`${API_BASE_URL}/kegiatan/${idIzin}/dokumen-asesi`, {
        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        if (json.message === "Success" && json.data) {
          setSptAsesor(json.data.spt_asesor || null)
          setVerifikasiTuk(json.data.verifikasi_tuk || null)
        }
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  return (
    <DokumenAsesiContext.Provider value={{ isOpen, loading, sptAsesor, verifikasiTuk, openModal, closeModal }}>
      {children}
    </DokumenAsesiContext.Provider>
  )
}

export function useDokumenAsesiModal() {
  const ctx = useContext(DokumenAsesiContext)
  if (!ctx) throw new Error("useDokumenAsesiModal must be used within DokumenAsesiProvider")
  return ctx
}
