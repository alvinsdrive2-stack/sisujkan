import {DokumenModal} from "@/components/komtek/DokumenModal"

export default function DokumenFullscreenModal({ isOpen, onClose, asesiId, asesiNama, jadwalId, onPenilaianSuccess, readOnly = false }: {
  isOpen: boolean
  onClose: () => void
  asesiId: string
  asesiNama: string
  jadwalId?: string
  onPenilaianSuccess?: () => void
  readOnly?: boolean
}) {
  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <DokumenModal
        isOpen={isOpen}
        onClose={onClose}
        asesiId={asesiId}
        asesiNama={asesiNama}
        jadwalId={jadwalId}
        onPenilaianSuccess={onPenilaianSuccess}
        readOnly={readOnly}
      />
    </div>
  )
}
