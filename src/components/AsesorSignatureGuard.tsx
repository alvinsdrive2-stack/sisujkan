import { ASESOR_SIGNATURE_POLLING_INTERVAL_MS as _ASESOR_SIGNATURE_POLLING_INTERVAL_MS } from "@/lib/polling-config"

interface AsesorSignatureGuardProps {
  missingAsesorLabels: string[]
  allAsesorSigned: boolean
  isAsesor: boolean
}

export function AsesorSignatureGuard({
  missingAsesorLabels,
  allAsesorSigned,
  isAsesor,
}: AsesorSignatureGuardProps) {
  if (isAsesor || allAsesorSigned) return null

  return (
    <div
      style={{
        background: "#fef3c7",
        border: "1px solid #f59e0b",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span style={{ fontSize: "18px" }}>&#9888;&#65039;</span>
      <div>
        <div style={{ fontWeight: 600, color: "#92400e", fontSize: "13px" }}>
          Menunggu Tanda Tangan Asesor
        </div>
        <div style={{ color: "#a16207", fontSize: "12px", marginTop: "2px" }}>
          {missingAsesorLabels.join(", ")} belum menandatangani dokumen ini.</div>
      </div>
    </div>
  )
}
