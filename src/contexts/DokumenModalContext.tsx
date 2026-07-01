import { createContext, useContext, useState, ReactNode } from "react"

interface DokumenModalContextType {
  isOpen: boolean
  asesiId: string
  asesiNama: string
  jadwalId: string
  openModal: (asesiId: string, asesiNama: string, readOnly?: boolean, jadwalId?: string) => void
  closeModal: () => void
  onPenilaianSuccess: (() => void) | null
  setOnPenilaianSuccess: (callback: (() => void) | null) => void
  readOnly: boolean
}

const DokumenModalContext = createContext<DokumenModalContextType | undefined>(undefined)

export function DokumenModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [asesiId, setAsesiId] = useState("")
  const [asesiNama, setAsesiNama] = useState("")
  const [jadwalId, setJadwalId] = useState("")
  const [onPenilaianSuccess, setOnPenilaianSuccess] = useState<(() => void) | null>(null)
  const [readOnly, setReadOnly] = useState(false)

  const openModal = (id: string, nama: string, readOnlyMode = false, jadwalIdParam = "") => {
    setAsesiId(id)
    setAsesiNama(nama)
    setReadOnly(readOnlyMode)
    setJadwalId(jadwalIdParam)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setAsesiId("")
    setAsesiNama("")
    setReadOnly(false)
    setJadwalId("")
  }

  return (
    <DokumenModalContext.Provider value={{ isOpen, asesiId, asesiNama, jadwalId, openModal, closeModal, onPenilaianSuccess, setOnPenilaianSuccess, readOnly }}>
      {children}
    </DokumenModalContext.Provider>
  )
}

export function useDokumenModal() {
  const context = useContext(DokumenModalContext)
  if (!context) {
    throw new Error("useDokumenModal must be used within DokumenModalProvider")
  }
  return context
}
