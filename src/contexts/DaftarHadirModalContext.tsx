import { createContext, useContext, useState, ReactNode } from "react"

type ModalMode = 'qr' | 'detail'
type PersonType = 'asesi' | 'asesor'
type KegiatanType = 'foto_bersama' | 'daftar_hadir_asesi' | 'daftar_hadir_asesor'

interface DaftarHadirModalContextType {
  isOpen: boolean
  mode: ModalMode
  personType: PersonType
  personId: string
  personName: string
  jadwalId: string
  openQrModal: (personType: PersonType, jadwalId: string) => void
  openDetailModal: (personType: PersonType, personId: string, personName: string, jadwalId: string) => void
  closeModal: () => void
  // Kegiatan Modal (Foto Bersama + Daftar Hadir)
  isKegiatanModalOpen: boolean
  kegiatanModalType: KegiatanType
  kegiatanModalJadwalId: string
  openKegiatanModal: (type: KegiatanType, jadwalId: string) => void
  closeKegiatanModal: () => void
}

const DaftarHadirModalContext = createContext<DaftarHadirModalContextType | undefined>(undefined)

export function DaftarHadirModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<ModalMode>('qr')
  const [personType, setPersonType] = useState<PersonType>('asesi')
  const [personId, setPersonId] = useState("")
  const [personName, setPersonName] = useState("")
  const [jadwalId, setJadwalId] = useState("")

  // Kegiatan Modal state
  const [isKegiatanModalOpen, setIsKegiatanModalOpen] = useState(false)
  const [kegiatanModalType, setKegiatanModalType] = useState<KegiatanType>('foto_bersama')
  const [kegiatanModalJadwalId, setKegiatanModalJadwalId] = useState("")

  const openQrModal = (type: PersonType, jadwal: string) => {
    setMode('qr')
    setPersonType(type)
    setPersonId("")
    setPersonName("")
    setJadwalId(jadwal)
    setIsOpen(true)
  }

  const openDetailModal = (type: PersonType, id: string, name: string, jadwal: string) => {
    setMode('detail')
    setPersonType(type)
    setPersonId(id)
    setPersonName(name)
    setJadwalId(jadwal)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setMode('qr')
    setPersonId("")
    setPersonName("")
  }

  const openKegiatanModal = (type: KegiatanType, jadwal: string) => {
    setKegiatanModalType(type)
    setKegiatanModalJadwalId(jadwal)
    setIsKegiatanModalOpen(true)
  }

  const closeKegiatanModal = () => {
    setIsKegiatanModalOpen(false)
    setKegiatanModalJadwalId("")
  }

  return (
    <DaftarHadirModalContext.Provider value={{
      isOpen,
      mode,
      personType,
      personId,
      personName,
      jadwalId,
      openQrModal,
      openDetailModal,
      closeModal,
      isKegiatanModalOpen,
      kegiatanModalType,
      kegiatanModalJadwalId,
      openKegiatanModal,
      closeKegiatanModal
    }}>
      {children}
    </DaftarHadirModalContext.Provider>
  )
}

export function useDaftarHadirModal() {
  const context = useContext(DaftarHadirModalContext)
  if (!context) {
    throw new Error("useDaftarHadirModal must be used within DaftarHadirModalProvider")
  }
  return context
}
