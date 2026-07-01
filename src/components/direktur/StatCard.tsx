import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  value: string | number
  label: string
  icon?: LucideIcon
  iconColor?: string
  bgColor?: string
  trend?: string
  trendUp?: boolean
}

export function StatCard({ value, label, trend, trendUp }: StatCardProps) {
  return (
    <Card>
      <CardContent className="px-6 py-5">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <div className="flex items-end justify-between mt-1">
          <p className="text-3xl font-semibold text-slate-900 tabular-nums">{value}</p>
          {trend && (
            <span className={`text-xs font-medium mb-1 ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
