import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  iconClassName?: string
}

export function EmptyState({ icon: Icon, title, description, iconClassName = "text-slate-400" }: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-slate-500">
      <Icon className={`w-12 h-12 mx-auto mb-4 ${iconClassName}`} />
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm">{description}</p>}
    </div>
  )
}
