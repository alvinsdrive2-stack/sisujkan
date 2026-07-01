import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface DocumentInfo {
  icon: LucideIcon
  label: string
  value: string
}

interface DocumentCardProps {
  nomorKegiatan: string
  skemaSertifikasi: string
  documentInfo: DocumentInfo[]
  jenisAsesmen: string
  badges?: ReactNode[]
  actions?: ReactNode[]
  cardClassName?: string
  onClick?: () => void
}

export function DocumentCard({
  nomorKegiatan,
  skemaSertifikasi,
  documentInfo,
  jenisAsesmen,
  badges = [],
  actions = [],
  cardClassName = "",
  onClick
}: DocumentCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-5 border border-slate-200 rounded-lg transition-all ${onClick ? 'cursor-pointer hover:border-primary hover:shadow-md' : ''} ${cardClassName}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-slate-800">{nomorKegiatan}</h4>
            {badges}
          </div>
          <p className="text-lg font-medium text-primary mb-3">{skemaSertifikasi}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {documentInfo.map((info, idx) => {
              const Icon = info.icon
              return (
                <div key={idx} className="flex items-center gap-2 text-slate-600">
                  <Icon className="w-4 h-4" />
                  <span>{info.label}: {info.value}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-500 mt-2">Jenis Asesmen: {jenisAsesmen}</p>
        </div>
      </div>
      {actions.length > 0 && (
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          {actions}
        </div>
      )}
    </div>
  )
}
