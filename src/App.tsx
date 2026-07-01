import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/auth-context'
import { ThemeProvider } from './contexts/theme-context'
import { ToastProvider } from './contexts/ToastContext'
import { DokumenModalProvider, useDokumenModal } from './contexts/DokumenModalContext'
import { DaftarHadirModalProvider, useDaftarHadirModal } from './contexts/DaftarHadirModalContext'
import { DokumenAsesiProvider } from './contexts/DokumenAsesiContext'
import DokumenAsesiModal from './components/asesor/DokumenAsesiModal'
import ProtectedRoute from './components/ProtectedRoute'
import ValidatedNavigationRoute from './components/ValidatedNavigationRoute'
import {
  AdminLSPRoute,
  AdminTUKRoute,
  AsesorRoute,
  AsesiRoute,
  KomtekRoute,
  DirekturLSPRoute,
  ManajerSertifikasiRoute,
  AsesiOrAsesorRoute,
} from './components/RoleRoute'
import PublicRoute from './components/PublicRoute'
import DefaultRoute from './components/DefaultRoute'
import AsesmenDataGate from './components/AsesmenDataGate'
import PraAsesmenDataGate from './components/PraAsesmenDataGate'
import DokumenFullscreenModal from './components/komtek/DokumenFullscreenModal'
import { DaftarHadirModal } from './components/admin-tuk/DaftarHadirModal'
import { KegiatanModal } from './components/admin-tuk/KegiatanModal'
import DashboardLayout from './components/DashboardLayout'
import AsesiMainLayout from './components/AsesiMainLayout'
import { Toaster } from './components/ui/toast'
import { FullPageLoader } from './components/ui/loading-spinner'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Route-level code splitting — each page loads only when navigated to
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CapturePage = lazy(() => import('./pages/CapturePage'))
const AttendancePage = lazy(() => import('./pages/AttendancePage'))

// Admin LSP Pages
const DashboardAdminLSP = lazy(() => import('./pages/admin-lsp/DashboardAdminLSP'))

// Direktur Pages
const TandatanganDirektur = lazy(() => import('./pages/direktur/TandatanganDirektur'))
const SudahDitandatangani = lazy(() => import('./pages/direktur/SudahDitandatangani'))
const DetailDokumenDirekturPage = lazy(() => import('./pages/direktur/DetailDokumenDirekturPage'))
const BelumDitandatangani = lazy(() => import('./pages/direktur/BelumDitandatangani'))

// Komtek Pages
const TandatanganKomtek = lazy(() => import('./pages/komtek/TandatanganKomtek'))
const SudahDitandatanganiKomtek = lazy(() => import('./pages/komtek/SudahDitandatangani'))
const BelumDitandatanganiKomtek = lazy(() => import('./pages/komtek/BelumDitandatangani'))
const DaftarAsesiPage = lazy(() => import('./pages/komtek/DaftarAsesiPage'))
const EditJadwalPage = lazy(() => import('./pages/komtek/EditJadwalPage'))
const DaftarAsesiAll = lazy(() => import('./pages/komtek/DaftarAsesiAll'))

// Manajer Pages
const DashboardManajer = lazy(() => import('./pages/manajer/DashboardManajer'))

// Admin TUK Pages
const DashboardAdminTUK = lazy(() => import('./pages/admin-tuk/DashboardAdminTUK'))
const ListAsesiAdminTUK = lazy(() => import('./pages/admin-tuk/ListAsesiAdminTUK'))

// Asesor Pages
const DashboardAsesor = lazy(() => import('./pages/asesor/DashboardAsesor'))
const ListAsesiAsesor = lazy(() => import('./pages/asesor/ListAsesiAsesor'))
const AsesiPage = lazy(() => import('./pages/asesor/AsesiPage'))
const TahapListPage = lazy(() => import('./pages/asesor/TahapListPage'))

// Qontak WhatsApp Pages
const QontakWhatsAppPage = lazy(() => import('./pages/qontak/QontakWhatsAppPage'))

// Asesi Pages
const DashboardAsesiPage = lazy(() => import('./pages/asesi/DashboardAsesiPage'))
const PraAsesmenPage = lazy(() => import('./pages/asesi/PraAsesmenPage'))
const AsesmenPage = lazy(() => import('./pages/asesi/AsesmenPage'))
const Ia01Page = lazy(() => import('./pages/asesi/asesmen/Ia01Page'))
const Ia02Page = lazy(() => import('./pages/asesi/asesmen/Ia02Page'))
const Ia03Page = lazy(() => import('./pages/asesi/asesmen/Ia03Page'))
const Ia04aPage = lazy(() => import('./pages/asesi/asesmen/Ia04aPage'))
const UploadTugasPage = lazy(() => import('./pages/asesi/asesmen/UploadTugasPage'))
const Ia04bPage = lazy(() => import('./pages/asesi/asesmen/Ia04bPage'))
const Ia04bKANPage = lazy(() => import('./pages/asesi/asesmen/Ia04bKANPage'))
const Ia05Page = lazy(() => import('./pages/asesi/asesmen/Ia05Page'))
const Ia05KANPage = lazy(() => import('./pages/asesi/asesmen/Ia05KANPage'))
const Ia06Page = lazy(() => import('./pages/asesi/asesmen/Ia06Page'))
const Ia08Page = lazy(() => import('./pages/asesi/asesmen/Ia08Page'))
const Ia09Page = lazy(() => import('./pages/asesi/asesmen/Ia09Page'))
const Ia10Page = lazy(() => import('./pages/asesi/asesmen/Ia10Page'))
const UjianPage = lazy(() => import('./pages/asesi/asesmen/UjianPage'))
const Ak02Page = lazy(() => import('./pages/asesi/asesmen/Ak02Page'))
const Ak03Page = lazy(() => import('./pages/asesi/asesmen/Ak03Page'))
const SurveiPage = lazy(() => import('./pages/asesi/asesmen/SurveiPage'))
const Ak05Page = lazy(() => import('./pages/asesi/asesmen/Ak05Page'))
const Ak06Page = lazy(() => import('./pages/asesi/asesmen/Ak06Page'))
const AsesmenSelesaiPage = lazy(() => import('./pages/asesi/asesmen/AsesmenSelesaiPage'))
const Apl01Page = lazy(() => import('./pages/asesi/Apl01Page'))
const Apl02Page = lazy(() => import('./pages/asesi/Apl02Page'))
const Apl02SuccessPage = lazy(() => import('./pages/asesi/Apl02SuccessPage'))
const Apl02FailedPage = lazy(() => import('./pages/asesi/Apl02FailedPage'))
const Ak01SuccessPage = lazy(() => import('./pages/asesi/Ak01SuccessPage'))
const Mapa01Page = lazy(() => import('./pages/asesi/Mapa01Page'))
const MukPage = lazy(() => import('./pages/asesi/MukPage'))
const Mapa02Page = lazy(() => import('./pages/asesi/Mapa02Page'))
const FrAk07Page = lazy(() => import('./pages/asesi/FrAk07Page'))
const FrAk04Page = lazy(() => import('./pages/asesi/FrAk04Page'))
const K3AsesmenPage = lazy(() => import('./pages/asesi/K3AsesmenPage'))
const FrAk01Page = lazy(() => import('./pages/asesi/FrAk01Page'))
const PraAsesmenByUuidPage = lazy(() => import('./pages/asesi/PraAsesmenByUuidPage'))
const VerifikasiTukAjjPage = lazy(() => import('./pages/asesi/VerifikasiTukAjjPage'))
const KonfirmasiDataPage = lazy(() => import('./pages/asesi/KonfirmasiDataPage'))
const DevSchedulePage = lazy(() => import('./pages/DevSchedulePage'))

// Catch chunk load failures (lazy import network errors) and reload
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || ''
  if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('Importing a module script failed')) {
    window.location.reload()
  }
})

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
        <DokumenModalProvider>
        <DaftarHadirModalProvider>
        <DokumenAsesiProvider>
        <Toaster />
        <Router>
        <NavigationTracker />
        <ErrorBoundary>
        <Suspense fallback={<FullPageLoader text="Memuat..." />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/persiapan-asesmen/:uuid" element={<PraAsesmenByUuidPage />} />
          <Route path="/praasesmen/:idIzin/verifikasi-tuk" element={<VerifikasiTukAjjPage />} />
          <Route path="/praasesmen/:idIzin/konfirmasi" element={<KonfirmasiDataPage />} />
          <Route path="/praasesmen/:idIzin/apl01" element={<Apl01Page />} />
          <Route path="/praasesmen/:idIzin/apl02" element={<Apl02Page />} />
          <Route path="/praasesmen/:idIzin/apl02/success" element={<Apl02SuccessPage />} />
          <Route path="/praasesmen/:idIzin/apl02/failed" element={<Apl02FailedPage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes - Admin LSP */}
          <Route
            path="/admin-lsp/*"
            element={
              <AdminLSPRoute>
                <ValidatedNavigationRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<DashboardAdminLSP />} />
                      <Route path="reports" element={<div className="p-4"><h2 className="text-xl font-bold">Laporan Sertifikasi</h2><p className="text-slate-600">Coming soon...</p></div>} />
                      <Route path="users" element={<div className="p-4"><h2 className="text-xl font-bold">Manajemen User</h2><p className="text-slate-600">Coming soon...</p></div>} />
                      <Route path="settings" element={<div className="p-4"><h2 className="text-xl font-bold">Pengaturan</h2><p className="text-slate-600">Coming soon...</p></div>} />
                      <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ValidatedNavigationRoute>
              </AdminLSPRoute>
            }
          />

          {/* Protected Routes - Direktur */}
          <Route
            path="/direktur/*"
            element={
              <DirekturLSPRoute>
                <ValidatedNavigationRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="tandatangan" element={<TandatanganDirektur />} />
                      <Route path="sudah-ditandatangani" element={<SudahDitandatangani />} />
                      <Route path="sudah-ditandatangani/:id" element={<DetailDokumenDirekturPage />} />
                      <Route path="belum-ditandatangani" element={<BelumDitandatangani />} />
                      <Route path="belum-ditandatangani/:id" element={<DetailDokumenDirekturPage />} />
                      <Route path="" element={<Navigate to="tandatangan" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ValidatedNavigationRoute>
              </DirekturLSPRoute>
            }
          />

          {/* Protected Routes - Komtek */}
          <Route
            path="/komtek/*"
            element={
              <KomtekRoute>
                <ValidatedNavigationRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="tandatangan" element={<TandatanganKomtek />} />
                      <Route path="sudah-ditandatangani" element={<SudahDitandatanganiKomtek />} />
                      <Route path="sudah-ditandatangani/:jadwalId" element={<DaftarAsesiPage />} />
                      <Route path="belum-ditandatangani" element={<BelumDitandatanganiKomtek />} />
                      <Route path="belum-ditandatangani/:jadwalId" element={<DaftarAsesiPage />} />
                      <Route path="edit-jadwal/:jadwalId" element={<EditJadwalPage />} />
                      <Route path="daftar-asesi" element={<DaftarAsesiAll />} />
                      <Route path="" element={<Navigate to="tandatangan" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ValidatedNavigationRoute>
              </KomtekRoute>
            }
          />

          {/* Protected Routes - Manajer Sertifikasi */}
          <Route
            path="/manajer/*"
            element={
              <ManajerSertifikasiRoute>
                <ValidatedNavigationRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<DashboardManajer />} />
                      <Route path="monitoring" element={<div className="p-4"><h2 className="text-xl font-bold">Monitoring Sertifikasi</h2><p className="text-slate-600">Coming soon...</p></div>} />
                      <Route path="asesi" element={<div className="p-4"><h2 className="text-xl font-bold">Daftar Asesi</h2><p className="text-slate-600">Coming soon...</p></div>} />
                      <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ValidatedNavigationRoute>
              </ManajerSertifikasiRoute>
            }
          />

          {/* Protected Routes - Admin TUK */}
          <Route
            path="/admin-tuk/*"
            element={
              <AdminTUKRoute>
                <ValidatedNavigationRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<DashboardAdminTUK />} />
                      <Route path="list-asesi/:jadwalId" element={<ListAsesiAdminTUK />} />
                      <Route path="verification" element={<div className="p-4"><h2 className="text-xl font-bold">Verifikasi Asesi</h2><p className="text-slate-600">Coming soon...</p></div>} />
                      <Route path="activity" element={<div className="p-4"><h2 className="text-xl font-bold">Kegiatan</h2><p className="text-slate-600">Coming soon...</p></div>} />
                      <Route path="schedule" element={<div className="p-4"><h2 className="text-xl font-bold">Jadwal Asesmen</h2><p className="text-slate-600">Coming soon...</p></div>} />
                      <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ValidatedNavigationRoute>
              </AdminTUKRoute>
            }
          />

          {/* Protected Routes - Asesor */}
          <Route
            path="/asesor/*"
            element={
              <AsesorRoute>
                <ValidatedNavigationRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="dashboard" element={<DashboardAsesor />} />
                      <Route path="persiapan" element={<TahapListPage tahap={0} />} />
                      <Route path="praasesmen" element={<TahapListPage tahap={1} />} />
                      <Route path="asesmen" element={<TahapListPage tahap={2} />} />
                      <Route path="list-asesi/:jadwalId" element={<ListAsesiAsesor />} />
                      <Route path="asesi/:jadwalId" element={<AsesiPage />} />
                      <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ValidatedNavigationRoute>
              </AsesorRoute>
            }
          />

          {/* Protected Routes - Qontak WhatsApp (any logged-in user) */}
          <Route
            path="/qontak/*"
            element={
              <DirekturLSPRoute>
                <ValidatedNavigationRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="whatsapp" element={<QontakWhatsAppPage />} />
                      <Route path="" element={<Navigate to="whatsapp" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ValidatedNavigationRoute>
              </DirekturLSPRoute>
            }
          />

          {/* Protected Routes - Asesi (nested under single parent, navbar renders once) */}
          <Route
            path="/asesi/*"
            element={
              <AsesiMainLayout>
                <ValidatedNavigationRoute>
                  <Routes>
                  <Route path="dashboard" element={<AsesiRoute><DashboardAsesiPage /></AsesiRoute>} />
                  <Route path="praasesmen" element={<AsesiOrAsesorRoute><PraAsesmenPage /></AsesiOrAsesorRoute>} />
                  <Route path="praasesmen/:idIzin" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><PraAsesmenPage /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/:idIzin/apl01" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><Apl01Page /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/:idIzin/apl02" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><Apl02Page /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/:idIzin/apl02/success" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><Apl02SuccessPage /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/:idIzin/apl02/failed" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><Apl02FailedPage /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/:idIzin/muk" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><MukPage /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/:idIzin/mapa01" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><Mapa01Page /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/:idIzin/mapa02" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><Mapa02Page /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/:idIzin/ak07" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><FrAk07Page /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/:idIzin/ak04" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><FrAk04Page /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/:idIzin/k3-asesmen" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><K3AsesmenPage /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/:idIzin/ak01" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><FrAk01Page /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="praasesmen/ak01-success" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><Ak01SuccessPage /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  {/* Perjanjian Asesmen */}
                  <Route path="perjanjian/:idIzin/ak01" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><FrAk01Page /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="perjanjian/ak01-success" element={<PraAsesmenDataGate><AsesiOrAsesorRoute><Ak01SuccessPage /></AsesiOrAsesorRoute></PraAsesmenDataGate>} />
                  <Route path="asesmen" element={<AsesiOrAsesorRoute><AsesmenPage /></AsesiOrAsesorRoute>} />
                  <Route path="asesmen/:id/ak01" element={<AsesmenDataGate><AsesiOrAsesorRoute><FrAk01Page /></AsesiOrAsesorRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ia01" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ia01Page /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ia02" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ia02Page /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ia03" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ia03Page /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ia04a" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ia04aPage /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/upload-tugas" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><UploadTugasPage /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ia04b" element={
                    import.meta.env.VITE_SAAT_INI === 'KAN'
                      ? <AsesmenDataGate><AsesiOrAsesorRoute><Ia04bKANPage /></AsesiOrAsesorRoute></AsesmenDataGate>
                      : <AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ia04bPage /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>
                  } />
                  <Route path="asesmen/:id/uji" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiRoute><UjianPage /></AsesiRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ia05" element={
                    import.meta.env.VITE_SAAT_INI === 'KAN'
                      ? <AsesmenDataGate><AsesiOrAsesorRoute><Ia05KANPage /></AsesiOrAsesorRoute></AsesmenDataGate>
                      : <AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ia05Page /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>
                  } />
                  <Route path="asesmen/:id/ia06" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ia06Page /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ak02" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ak02Page /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ak03" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ak03Page /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/survei" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiRoute><SurveiPage /></AsesiRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ak05" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesorRoute><Ak05Page /></AsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ak06" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesorRoute><Ak06Page /></AsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ia08" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ia08Page /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ia09" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ia09Page /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/ia10" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><Ia10Page /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="asesmen/:id/selesai" element={<AsesmenDataGate><ValidatedNavigationRoute><AsesiOrAsesorRoute><AsesmenSelesaiPage /></AsesiOrAsesorRoute></ValidatedNavigationRoute></AsesmenDataGate>} />
                  <Route path="profile" element={<AsesiRoute><div className="p-4"><h2 className="text-xl font-bold">Profil Saya</h2><p className="text-slate-600">Coming soon...</p></div></AsesiRoute>} />
                  <Route path="assessment" element={<AsesiRoute><div className="p-4"><h2 className="text-xl font-bold">Sertifikasi</h2><p className="text-slate-600">Coming soon...</p></div></AsesiRoute>} />
                  <Route path="documents" element={<AsesiRoute><div className="p-4"><h2 className="text-xl font-bold">Dokumen</h2><p className="text-slate-600">Coming soon...</p></div></AsesiRoute>} />
                  <Route path="" element={<Navigate to="dashboard" replace />} />
                </Routes>
                </ValidatedNavigationRoute>
              </AsesiMainLayout>
            }
          />

          {/* Legacy Dashboard Route - Redirects based on role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ValidatedNavigationRoute>
                  <DashboardPage />
                </ValidatedNavigationRoute>
              </ProtectedRoute>
            }
          />

          {/* Dev Routes */}
          <Route path="/dev/schedule" element={<DevSchedulePage />} />

          {/* Default Route */}
          <Route path="/" element={<DefaultRoute />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </Router>
      <GlobalDokumenFullscreenModal />
      <GlobalDaftarHadirModal />
      <DokumenAsesiModal />
      </DokumenAsesiProvider>
      </DaftarHadirModalProvider>
      </DokumenModalProvider>
      </ToastProvider>
    </ThemeProvider>
    </AuthProvider>
  )
}

// Intercept all react-router navigations via History API + click listener
// Path-based validation: stores the path that internal nav intends to go to.
// Manual URL typing or back/forward breaks the match → ValidatedNavigationRoute redirects.
function NavigationTracker() {
  useEffect(() => {
    if (import.meta.env.VITE_VALIDATED_NAVIGATION !== '1') return

    const extractPath = (url: unknown): string => {
      if (typeof url !== 'string') return window.location.pathname
      try {
        return new URL(url, window.location.origin).pathname
      } catch {
        return window.location.pathname
      }
    }

    // Patch History API used by react-router for navigate() and Link clicks
    const origPushState = history.pushState
    const origReplaceState = history.replaceState

    history.pushState = function (...args) {
      sessionStorage.setItem('validated_nav_path', extractPath(args[2]))
      return origPushState.apply(this, args)
    }

    history.replaceState = function (...args) {
      sessionStorage.setItem('validated_nav_path', extractPath(args[2]))
      return origReplaceState.apply(this, args)
    }

    // Also catch link clicks (backup for any that bypass pushState)
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      const href = link?.getAttribute('href')
      if (link && href && href.startsWith('/')) {
        sessionStorage.setItem('validated_nav_path', extractPath(href))
      }
    }
    document.addEventListener('click', handleClick)

    // Clear flag on back/forward — popstate fires before React Router processes it,
    // so ValidatedNavigationRoute sees no matching path and redirects to dashboard
    const handlePopState = () => {
      sessionStorage.removeItem('validated_nav_path')
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      history.pushState = origPushState
      history.replaceState = origReplaceState
      document.removeEventListener('click', handleClick)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return null
}

function GlobalDokumenFullscreenModal() {
  const { isOpen, closeModal, asesiId, asesiNama, jadwalId, onPenilaianSuccess, readOnly } = useDokumenModal()
  return (
    <DokumenFullscreenModal
      isOpen={isOpen}
      onClose={closeModal}
      asesiId={asesiId}
      asesiNama={asesiNama}
      jadwalId={jadwalId}
      onPenilaianSuccess={onPenilaianSuccess || undefined}
      readOnly={readOnly}
    />
  )
}

function GlobalDaftarHadirModal() {
  const { isOpen, mode, personType, personId, personName, jadwalId, closeModal, isKegiatanModalOpen, kegiatanModalType, kegiatanModalJadwalId, closeKegiatanModal } = useDaftarHadirModal()
  return (
    <>
      <DaftarHadirModal
        isOpen={isOpen}
        mode={mode}
        personType={personType}
        personId={personId}
        personName={personName}
        jadwalId={jadwalId}
        onClose={closeModal}
      />
      <KegiatanModal
        isOpen={isKegiatanModalOpen}
        type={kegiatanModalType}
        jadwalId={kegiatanModalJadwalId}
        onClose={closeKegiatanModal}
      />
    </>
  )
}

export default App
