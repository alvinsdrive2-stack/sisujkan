import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"

interface AsesmenBreadcrumbProps {
  currentPage: string
  isAsesorOverride?: boolean
}

export default function AsesmenBreadcrumb({ currentPage, isAsesorOverride }: AsesmenBreadcrumbProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAsesor = isAsesorOverride ?? user?.role?.id === RoleId.ASESOR

  return (
    <div style={{ borderBottom: '1px solid #999', background: '#fff' }}>
      <div style={{ padding: '12px 16px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#666' }}>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(isAsesor ? "/asesor/dashboard" : "/asesi/dashboard")}>Dashboard</span>
          <span>/</span>
          <span>Asesmen</span>
          <span>/</span>
          <span>{currentPage}</span>
        </div>
      </div>
    </div>
  )
}
