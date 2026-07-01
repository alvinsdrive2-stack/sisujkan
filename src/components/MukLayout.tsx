import { ReactNode, useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import ModularStepIndicator from "./ModularStepIndicator"
import Apl02FilePanel from "./Apl02FilePanel"
import { getMukSteps } from "@/lib/asesmen-steps"
import { RoleId } from "@/lib/rbac-config"

interface MukLayoutProps {
  children: ReactNode
  currentStep: number
  idIzin?: string
  metode?: string
  tahap?: number
  jenjang?: string
}

function getMukTitle(metode?: string): string {
  const lower = metode?.toLowerCase()
  if (lower === 'portofolio') return 'MUK Portofolio'
  return 'MUK Observasi'
}

export default function MukLayout({ children, currentStep, idIzin, metode, tahap = 1, jenjang = '0' }: MukLayoutProps) {
  const { user } = useAuth()
  const isAsesor = user?.role?.id === RoleId.ASESOR
  const [showSteps, setShowSteps] = useState(false)
  const [showFiles, setShowFiles] = useState(false)
  const [filePanelCollapsed, setFilePanelCollapsed] = useState(false)

  // Resolve :idIzin in step hrefs
  const resolvedSteps = useMemo(() =>
    getMukSteps(tahap, jenjang, metode).map(s => ({
      ...s,
      href: idIzin ? s.href.replace(':idIzin', idIzin) : s.href,
    })),
    [tahap, jenjang, metode, idIzin]
  )

  return (
    <div className="flex flex-col lg:flex-row" style={{ gap: '30px', padding: '20px', maxWidth: '1720px', margin: '0 auto', alignItems: 'flex-start' }}>
      {/* Sidebar - desktop */}
      <div className="hidden lg:block" style={{ position: 'sticky', top: '80px', alignSelf: 'flex-start' }}>
        <ModularStepIndicator currentStep={currentStep} steps={resolvedSteps} disableClick={!isAsesor} title={getMukTitle(metode)} />
      </div>

      {/* Main Content */}
      <div className="w-full" style={{ flex: 1, minWidth: 0, maxWidth: filePanelCollapsed ? '1200px' : '900px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'max-width 0.25s ease' }}>
        {children}
      </div>

      {/* File Panel - desktop */}
      <div className="hidden lg:block" style={{ position: 'sticky', top: '100px', alignSelf: 'flex-start' }}>
        <Apl02FilePanel idIzin={idIzin} onCollapse={setFilePanelCollapsed} />
      </div>

      {/* Floating button - Steps (mobile) */}
      <button
        className="lg:hidden fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
        style={{ background: '#0d2137', color: '#fff', border: 'none' }}
        onClick={() => setShowSteps(true)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>

      {/* Floating button - Files (mobile) */}
      <button
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
        style={{ background: '#0d2137', color: '#fff', border: 'none' }}
        onClick={() => setShowFiles(true)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </button>

      {/* Modal - Steps (mobile) */}
      {showSteps && (
        <div className="lg:hidden fixed inset-0 z-[60] flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowSteps(false)}>
          <div className="w-full rounded-t-2xl" style={{ background: '#fff', maxHeight: '70vh', overflowY: 'auto', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#ddd' }} />
            <ModularStepIndicator currentStep={currentStep} steps={resolvedSteps} disableClick={!isAsesor} title={getMukTitle(metode)} />
          </div>
        </div>
      )}

      {/* Modal - Files (mobile) */}
      {showFiles && (
        <div className="lg:hidden fixed inset-0 z-[60] flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowFiles(false)}>
          <div className="w-full rounded-t-2xl" style={{ background: '#fff', maxHeight: '70vh', overflowY: 'auto', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#ddd' }} />
            <Apl02FilePanel idIzin={idIzin} onCollapse={setFilePanelCollapsed} />
          </div>
        </div>
      )}
    </div>
  )
}
