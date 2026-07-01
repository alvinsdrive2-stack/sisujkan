import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import { File, Trash2, Check, FileImage, FileType, Eye, X } from 'lucide-react'
import AsesiLayout from "@/components/AsesiLayout"
import DashboardNavbar from "@/components/DashboardNavbar"
import UuidStepIndicator from "@/components/UuidStepIndicator"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { useSigningState } from "@/hooks/useSigningState"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { API_BASE_URL } from "@/config/api"
import { FullPageLoader } from "@/components/ui/loading-spinner"

// ============== LAYOUT COMPONENT ==============

interface Apl02PageLayoutProps {
  children: React.ReactNode
  isUuidFlow: boolean
  _idIzin: string | null
  idIzin: string | undefined
  tahap: number
}

const Apl02PageLayout = ({ children, isUuidFlow, _idIzin, idIzin, tahap }: Apl02PageLayoutProps) => {
  return isUuidFlow ? (
    <div style={{ padding: '30px 16px', maxWidth: '860px', margin: '0 auto' }}>
      <UuidStepIndicator currentStep={3} isVerifikasiPage={false} />
      <div style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', padding: '32px 40px', marginTop: '24px', borderRadius: '2px' }}>
        {children}
      </div>
    </div>
  ) : (
    <AsesiLayout currentStep={3} idIzin={_idIzin || idIzin} tahap={tahap} showVerifikasiTukAjj={false}>{children}</AsesiLayout>
  )
}

// ============== ANIMATED COMPONENTS ==============

// Rekomendasi Asesi Section - state isolated untuk prevent parent rerender
interface RekomendasiAsesiSectionProps {
  initialValue: 'observasi' | 'portofolio' | null
  isAsesor: boolean
  jenjang?: string
  asesorList: Array<{ id: number | string; nama?: string; noreg?: string }>
  namaAsesi?: string
  apl02Data: Apl02Data | null
  user: any
  subunitBarcodes: Record<string, SubunitBarcodes>
  onMetodeChange: (metode: 'observasi' | 'portofolio' | null) => void
}

const RekomendasiAsesiSection = React.memo(({ initialValue, isAsesor, jenjang, asesorList, namaAsesi, apl02Data, user, subunitBarcodes, onMetodeChange }: RekomendasiAsesiSectionProps) => {
  // State di sini - tidak affect parent
  const [metodeAsesmen, setMetodeAsesmen] = useState<'observasi' | 'portofolio' | null>(initialValue)

  // Sync state when prop changes (API data loads after first render)
  useEffect(() => {
    setMetodeAsesmen(initialValue)
  }, [initialValue])

  // Notify parent when value changes (for POST)
  useEffect(() => {
    onMetodeChange(metodeAsesmen)
  }, [metodeAsesmen, onMetodeChange])

  return (
    <>
      {/* Rekomendasi Untuk Asesi */}
      <div style={{ padding: '8px 12px', marginBottom: '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>REKOMENDASI UNTUK ASESI</span>
      </div>

      <table style={{ width: '100%', maxWidth: '100%', tableLayout: 'fixed', contain: 'content', background: '#fff', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '13px', color: '#000', marginBottom: '20px' }}>
        <tbody>
          {/* Rekomendasi & Asesi Row 1 */}
          <tr>
            <td rowSpan={3 + (asesorList.length > 0 ? asesorList.length * 4 : 3)} style={{ width: '30%', border: '1px solid #000', padding: '8px', verticalAlign: 'middle' }}>
              <span style={{ fontWeight: 'bold' }}>
                Rekomendasi Untuk Asesi: Asesmen{' '}
                <span style={{ textDecoration: apl02Data?.is_dilanjutkan === false ? 'line-through' : 'none' }}>dapat</span> / {' '}
                <span style={{ textDecoration: apl02Data?.is_dilanjutkan === true ? 'line-through' : 'none' }}>tidak dapat</span> dilanjutkan melalui pendekatan
              </span><br /><br />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: isAsesor ? 'pointer' : 'not-allowed' }}>
                <CustomCheckbox
                  checked={metodeAsesmen === 'observasi'}
                  onChange={() => setMetodeAsesmen('observasi')}
                  disabled={!isAsesor}
                />
                <span>Observasi</span>
              </label>
              {parseInt(jenjang || '0') >= 4 && (
                <>
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: isAsesor ? 'pointer' : 'not-allowed' }}>
                    <CustomCheckbox
                      checked={metodeAsesmen === 'portofolio'}
                      onChange={() => setMetodeAsesmen('portofolio')}
                      disabled={!isAsesor}
                    />
                    <span>Portofolio</span>
                  </label>
                </>
              )}
            </td>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Asesi :</td>
          </tr>
          {/* Asesi Row 2 */}
          <tr>
            <td style={{ width: '20%', border: '1px solid #000', padding: '8px' }}>Nama</td>
            <td style={{ width: '25%', border: '1px solid #000', padding: '8px' }}>{namaAsesi?.toUpperCase() || apl02Data?.nama_asesi?.toUpperCase() || user?.name?.toUpperCase() || ''}</td>
          </tr>
          {/* Asesi Row 3 - Signature */}
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>Tanda tangan/<br />Tanggal</td>
            <td style={{ height: '120px', border: '1px solid #000', padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
              {(() => {
                const firstAsesiBarcode = Object.values(subunitBarcodes).find(b => b.asesi?.url)?.asesi
                if (firstAsesiBarcode?.url) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <img
                        src={firstAsesiBarcode.url}
                        alt="Tanda Tangan Asesi"
                        style={{ height: '70px', width: '70px', objectFit: 'contain' }}
                      />
                      {firstAsesiBarcode.tanggal && (
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
                          {new Date(firstAsesiBarcode.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  )
                }
                return '-'
              })()}
            </td>
          </tr>

          {/* Dynamic Asesor Rows */}
          {asesorList.length > 0 ? (
            asesorList.map((asesor, idx) => {
              const firstSubunitId = Object.keys(subunitBarcodes)[0]
              const asesorBarcode = firstSubunitId
                ? (idx === 0 ? subunitBarcodes[firstSubunitId]?.asesor1 : subunitBarcodes[firstSubunitId]?.asesor2)
                : null

              return (
                <React.Fragment key={asesor.id}>
                  {idx === 0 && (
                    <tr>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Ditinjau Oleh Asesor :</td>
                    </tr>
                  )}
                  {idx > 0 && (
                    <tr>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Asesor :</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>Nama Asesor {asesorList.length > 1 ? idx + 1 : ''} :</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{asesor.nama?.toUpperCase() || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>No. Reg:</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{asesor.noreg || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>Tanda tangan/<br />Tanggal</td>
                    <td style={{ height: '120px', border: '1px solid #000', padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                      {asesorBarcode?.url ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <img
                            src={asesorBarcode.url}
                            alt={`Tanda Tangan ${asesor.nama}`}
                            style={{ height: '70px', width: '70px', objectFit: 'contain' }}
                          />
                          {asesorBarcode.tanggal && (
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
                              {new Date(asesorBarcode.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                </React.Fragment>
              )
            })
          ) : (
            // Fallback static Asesor
            <>
              <tr>
                <td></td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Ditinjau Oleh Asesor :</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>Nama Asesor :</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{apl02Data?.nama_asesor?.toUpperCase() || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>No. Reg:</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>Tanda tangan/<br />Tanggal</td>
                <td style={{ height: '120px', border: '1px solid #000', padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                  {(() => {
                    const firstSubunitId = Object.keys(subunitBarcodes)[0]
                    const asesor1Barcode = firstSubunitId ? subunitBarcodes[firstSubunitId]?.asesor1 : null
                    if (asesor1Barcode?.url) {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <img
                            src={asesor1Barcode.url}
                            alt="Tanda Tangan Asesor"
                            style={{ height: '70px', width: '70px', objectFit: 'contain' }}
                          />
                          {asesor1Barcode.tanggal && (
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
                              {new Date(asesor1Barcode.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      )
                    }
                    return '-'
                  })()}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </>
  )
})

// Apl02 Content - memoized untuk prevent rerender saat metodeAsesmen berubah
interface Apl02ContentProps {
  apl02Data: Apl02Data | null
  kukChecklist: Record<string, 'K' | 'BK' | null>
  kukBukti: Record<string, number[]>
  uploadedFilesInfo: Array<{ id: number; name: string; path: string; kebenaran?: boolean }>
  excludedApiFileIds: Set<string>
  isAsesor: boolean
  isSaving: boolean
  jenjang: string | number
  onCheckRadio: (kukId: string, value: 'K' | 'BK' | null, unitId: string, subunitId: string) => void
  onToggleExclude: (unitId: string, subunitId: string, fileId: number) => void
  onRemoveBukti: (kukId: string, fileId: number, unitId: string, subunitId: string) => void
  onSelectBukti: (kukId: string, fileId: number, unitId: string, subunitId: string) => void
  onViewFile: (file: { id: number; name: string; path: string }) => void
  refreshKey: number
}

const Apl02Content = React.memo<Apl02ContentProps>(({ apl02Data, kukChecklist, kukBukti, uploadedFilesInfo, excludedApiFileIds, isAsesor, isSaving, onCheckRadio, onToggleExclude, onRemoveBukti, onSelectBukti, onViewFile }) => {
  if (!apl02Data) return null

  // All KUK IDs across all units for shift-click global toggle
  const allKukIdsGlobal: string[] = []
  apl02Data.units.forEach(unit => {
    unit.subunits.forEach(subunit => {
      subunit.kuk_list.forEach(kuk => {
        allKukIdsGlobal.push(`${unit.id}-${subunit.id}-${kuk.no_kuk}`)
      })
    })
  })
  const globalAllK = allKukIdsGlobal.every(id => kukChecklist[id] === 'K')
  const globalAllBK = allKukIdsGlobal.every(id => kukChecklist[id] === 'BK')

  return (
    <>
      {/* Header Table */}
      <table style={{ width: '100%', tableLayout: 'fixed', contain: 'content', borderCollapse: 'collapse', marginBottom: '20px', background: '#fff', fontSize: '12px' }}>
        <tbody>
          <tr>
            <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', width: '25%', fontWeight: 'bold', verticalAlign: 'top', textTransform: 'uppercase' }}>
              Skema Sertifikasi<br />
              <span style={{ fontSize: '11px', fontWeight: 'normal' }}>(̶𝙺̶𝙺̶𝙽̶𝙸̶/Okupasi/̶𝙺̶𝚕̶𝚊̶𝚜̶𝚝̶𝚎̶𝚛̶)̶</span>
            </td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', width: '12%', fontWeight: 'bold', textTransform: 'uppercase' }}>Judul</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', width: '3%', textAlign: 'center' }}>:</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textTransform: 'uppercase' }}>{apl02Data.jabatan_kerja}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Nomor</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>:</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textTransform: 'uppercase' }}>{apl02Data.no_skema}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', textTransform: 'uppercase' }}>TUK</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>:</td>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', textTransform: 'uppercase' }}>{apl02Data.tuk || '-'}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Nama Asesor</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>:</td>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', textTransform: 'uppercase' }}>{apl02Data.nama_asesor || '-'}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Nama Asesi</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>:</td>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', textTransform: 'uppercase' }}>{apl02Data.nama_asesi || '-'}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', textTransform: 'uppercase' }}>Tanggal</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>:</td>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', textTransform: 'uppercase' }}>{apl02Data.tanggal || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Panduan */}
      <div style={{ background: '#c00000', color: '#fff', padding: '6px 8px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>
        Panduan Asesmen Mandiri
      </div>
      <div style={{ background: '#fff', border: '1px solid #000', marginBottom: '20px', fontSize: '11px' }}>
        <div style={{ padding: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>Instruksi:</div>
          <ul style={{ margin: '4px 0 4px 20px', padding: 0 }}>
            <li>Baca setiap pertanyaan di kolom sebelah kiri</li>
            <li>Beri tanda centang (v) pada kotak jika Anda yakin dapat melakukan tugas yang dijelaskan</li>
            <li>Isi kolom di sebelah kanan dengan mendaftar bukti yang Anda miliki</li>
          </ul>
        </div>
      </div>

      {/* Daftar Unit Kompetensi */}
      {apl02Data.units.map((unit, unitIndex) => (
        <table key={unit.id} style={{ width: '100%', tableLayout: 'fixed', contain: 'content', borderCollapse: 'collapse', marginBottom: '20px', background: '#fff', fontSize: '11px' }}>
          <tbody>
            {/* Unit Title */}
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', width: '45%', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Kode & Judul<br />Kompetensi {unitIndex + 1} :
              </td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '5%' }}></td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '5%' }}></td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '45%' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{unit.kode}</div>
                <div>{unit.judul_kompetensi}</div>
              </td>
            </tr>

            {/* Header Row - DAPATKAH SAYA ? */}
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px', width: '45%',fontWeight: 'bold', textTransform: 'uppercase' }}>DAPATKAH SAYA ?</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '5%', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase' }}>K</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '5%', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase' }}>BK</td>
              <td style={{ border: '1px solid #000', padding: '4px', width: '45%', fontWeight: 'bold', textTransform: 'uppercase' }}>Bukti</td>
            </tr>

            {/* Subunits & KUK */}
            {unit.subunits.map((subunit) => {
              const kukCount = subunit.kuk_list.length
              const firstKukId = kukCount > 0 ? `${unit.id}-${subunit.id}-${subunit.kuk_list[0].no_kuk}` : ''
              const allKukIds = subunit.kuk_list.map(k => `${unit.id}-${subunit.id}-${k.no_kuk}`)
              const isSubunitK = allKukIds.some(id => kukChecklist[id] === 'K')
              const isSubunitBK = allKukIds.some(id => kukChecklist[id] === 'BK')
              const subunitFileIds = kukBukti[firstKukId] || []

              const handleSubunitK = (shiftKey?: boolean) => {
                if (shiftKey) {
                  const v = globalAllK ? 'BK' : 'K'
                  allKukIdsGlobal.forEach(kid => {
                    const p = kid.split('-')
                    onCheckRadio(kid, v, p[0], `${p[0]}-${p[1]}`)
                  })
                } else {
                  const v = isSubunitK ? null : 'K'
                  allKukIds.forEach(kid => onCheckRadio(kid, v, unit.id, subunit.id))
                }
              }
              const handleSubunitBK = (shiftKey?: boolean) => {
                if (shiftKey) {
                  const v = globalAllBK ? 'K' : 'BK'
                  allKukIdsGlobal.forEach(kid => {
                    const p = kid.split('-')
                    onCheckRadio(kid, v, p[0], `${p[0]}-${p[1]}`)
                  })
                } else {
                  const v = isSubunitBK ? null : 'BK'
                  allKukIds.forEach(kid => onCheckRadio(kid, v, unit.id, subunit.id))
                }
              }

              return (
              <React.Fragment key={subunit.id}>
                {/* Elemen Header */}
                <tr>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Elemen {subunit.no_elemen} :</span><br />
                    {subunit.judul_elemen}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                </tr>

                {/* KUK Rows with rowspan for K/BK + Bukti */}
                {subunit.kuk_list.map((kuk, idx) => {
                  const kukId = `${unit.id}-${subunit.id}-${kuk.no_kuk}`
                  return (
                    <tr key={kukId}>
                      <td style={{ border: '1px solid #000', padding: '4px', width: '45%', verticalAlign: 'top' }}>
                        {kuk.no_kuk} {kuk.judul_kuk}
                      </td>
                      {idx === 0 && (
                        <>
                          <td rowSpan={kukCount} style={{ border: '1px solid #000', padding: '4px', width: '5%', textAlign: 'center', verticalAlign: 'middle' }}>
                            <CustomCheckbox checked={isSubunitK} onChange={handleSubunitK} disabled={isAsesor || isSaving} />
                          </td>
                          <td rowSpan={kukCount} style={{ border: '1px solid #000', padding: '4px', width: '5%', textAlign: 'center', verticalAlign: 'middle' }}>
                            <CustomCheckbox checked={isSubunitBK} onChange={handleSubunitBK} disabled={isAsesor || isSaving} />
                          </td>
                          <td rowSpan={kukCount} style={{ border: '1px solid #000', padding: '6px 8px', width: '45%', verticalAlign: 'top' }}>
                            {(subunit.files || []).length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                {(subunit.files || []).map((file) => (
                                  <AnimatedCapsule
                                    key={file.id}
                                    fileName={file.name}
                                    file={file}
                                    isExcluded={excludedApiFileIds.has(`${unit.id}-${subunit.id}-${file.id}`)}
                                    isAsesor={isAsesor}
                                    onView={onViewFile}
                                    onRemove={() => onToggleExclude(unit.id, subunit.id, file.id)}
                                  />
                                ))}
                              </div>
                            )}
                            {subunitFileIds.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                {subunitFileIds.map(id => {
                                  const fInfo = uploadedFilesInfo.find(f => f.id === id)
                                  if (!fInfo) return null
                                  return (
                                    <AnimatedCapsule
                                      key={id}
                                      fileName={fInfo.name}
                                      file={fInfo}
                                      isAsesor={isAsesor}
                                      onView={onViewFile}
                                      onRemove={() => onRemoveBukti(firstKukId, id, unit.id, subunit.id)}
                                    />
                                  )
                                })}
                              </div>
                            )}
                            <BuktiDropdown
                              kukId={firstKukId}
                              uploadedFiles={uploadedFilesInfo}
                              selectedFileIds={subunitFileIds}
                              onSelectFile={(_: string, fileId: number) => onSelectBukti(firstKukId, fileId, unit.id, subunit.id)}
                              disabled={isAsesor || isSaving}
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </React.Fragment>
              )
            })}
          </tbody>
        </table>
      ))}
    </>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - hanya re-render jika data/answers berubah
  return (
    prevProps.apl02Data === nextProps.apl02Data &&
    prevProps.kukChecklist === nextProps.kukChecklist &&
    prevProps.kukBukti === nextProps.kukBukti &&
    prevProps.uploadedFilesInfo === nextProps.uploadedFilesInfo &&
    prevProps.excludedApiFileIds === nextProps.excludedApiFileIds &&
    prevProps.isAsesor === nextProps.isAsesor &&
    prevProps.isSaving === nextProps.isSaving &&
    prevProps.jenjang === nextProps.jenjang
    // Callbacks tidak perlu dicek (harus stable dengan useCallback)
  )
})

// Animated Capsule/Chip with smooth entry and exit
interface AnimatedCapsuleProps {
  fileName: string
  onRemove: () => void
  isExcluded?: boolean // For API files that are excluded
  style?: React.CSSProperties
  file?: { id: number; name: string; path: string } // Full file object for preview
  isAsesor?: boolean
  onView?: (file: { id: number; name: string; path: string }) => void
}

function AnimatedCapsule({ fileName, onRemove, isExcluded, style, file, isAsesor, onView }: AnimatedCapsuleProps) {
  const [isExiting, setIsExiting] = useState(false)
  const capsuleRef = useRef<HTMLSpanElement>(null)

  const handleRemove = () => {
    if (isAsesor) return // Asesor cannot remove files
    setIsExiting(true)
    setTimeout(() => {
      onRemove()
    }, 200)
  }

  const handleClick = () => {
    if (isAsesor && file && onView) {
      onView(file)
    }
  }

  return (
    <span
      ref={capsuleRef}
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: '38px',
        background: isAsesor ? '#f1f5f9' : (isExcluded ? '#fee' : '#f5f5f5'),
        border: isAsesor ? '1px solid #cbd5e1' : (isExcluded ? '1px solid #fca5a5' : '1px solid #ddd'),
        borderRadius: '6px',
        padding: '0 12px',
        fontSize: '12px',
        fontWeight: '500',
        color: isAsesor ? '#0369a1' : (isExcluded ? '#991b1b' : '#333'),
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        transform: isExiting ? 'scale(0.9) translateX(-10px)' : 'scale(1) translateX(0)',
        opacity: isExiting ? 0 : (isExcluded ? 0.6 : 1),
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: isAsesor ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isExiting) {
          if (isAsesor) {
            e.currentTarget.style.background = '#e2e8f0'
            e.currentTarget.style.borderColor = '#94a3b8'
          } else {
            e.currentTarget.style.background = isExcluded ? '#fecaca' : '#eee'
            e.currentTarget.style.borderColor = isExcluded ? '#f87171' : '#ccc'
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!isExiting) {
          if (isAsesor) {
            e.currentTarget.style.background = '#f1f5f9'
            e.currentTarget.style.borderColor = '#cbd5e1'
          } else {
            e.currentTarget.style.background = isExcluded ? '#fee' : '#f5f5f5'
            e.currentTarget.style.borderColor = isExcluded ? '#fca5a5' : '#ddd'
          }
        }
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <File size={14} style={{ color: isAsesor ? '#0284c7' : (isExcluded ? '#dc2626' : '#666') }} />
        <span style={{
          maxWidth: '200px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: isAsesor ? '#0284c7' : 'inherit'
        }}>
          {fileName}
        </span>
      </span>
      {/* Show Eye icon for asesor, Trash/Check icon for asesi */}
      {!isAsesor && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleRemove()
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: isExcluded ? '#dc2626' : '#999',
            cursor: 'pointer',
            padding: '0',
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!isExiting) {
              e.currentTarget.style.background = isExcluded ? '#dc2626' : '#dc2626'
              e.currentTarget.style.color = '#fff'
            }
          }}
          onMouseLeave={(e) => {
            if (!isExiting) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = isExcluded ? '#dc2626' : '#999'
            }
          }}
          title={isExcluded ? 'Sertakan kembali' : 'Hapus dari jawaban'}
        >
          {isExcluded ? <Check size={12} /> : <Trash2 size={12} />}
        </button>
      )}
      {/* Show Eye icon for asesor */}
      {isAsesor && (
        <span style={{ display: 'flex', alignItems: 'center', color: '#0369a1', marginLeft: '4px' }}>
          <Eye size={14} />
        </span>
      )}
    </span>
  )
}

// Server File Capsule with delete button for uploaded files
interface ServerFileCapsuleProps {
  file: { id: number; name: string; path: string }
  onDelete: (fileId: number) => void
  disabled?: boolean
  isAsesor?: boolean
  onView?: (file: { id: number; name: string; path: string }) => void
}

function ServerFileCapsule({ file, onDelete, disabled, isAsesor, onView }: ServerFileCapsuleProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleDelete = () => {
    if (disabled) return
    setShowConfirmDialog(true)
  }

  const confirmDelete = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDelete(file.id)
    }, 200)
    setShowConfirmDialog(false)
  }

  const isKebenaran = file.id < 0

  const handleCapsuleClick = () => {
    if (onView) {
      onView(file)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isKebenaran) {
      // Kebenaran files are read-only, always open preview
      if (onView) onView(file)
    } else if (isAsesor && onView) {
      onView(file)
    } else if (!disabled) {
      handleDelete()
    }
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Hapus File"
        message={`Apakah Anda yakin ingin menghapus file "${file.name}"?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        confirmColor="#dc2626"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDialog(false)}
      />
      <span
        onClick={handleCapsuleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          height: '38px',
          background: isKebenaran ? '#f5f3ff' : (isAsesor ? '#e0f2fe' : '#f5f5f5'),
          border: isKebenaran ? '1px solid #ddd6fe' : (isAsesor ? '1px solid #0ea5e9' : '1px solid #ddd'),
          borderRadius: '6px',
          padding: '0 12px',
          fontSize: '12px',
          fontWeight: '500',
          color: '#333',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transform: isExiting ? 'scale(0.9) translateX(-10px)' : 'scale(1) translateX(0)',
          opacity: isExiting ? 0 : 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isExiting) {
            e.currentTarget.style.background = isKebenaran ? '#ede9fe' : (isAsesor ? '#bae6fd' : '#eee')
            e.currentTarget.style.borderColor = isKebenaran ? '#c4b5fd' : (isAsesor ? '#0284c7' : '#ccc')
          }
        }}
        onMouseLeave={(e) => {
          if (!isExiting) {
            e.currentTarget.style.background = isAsesor ? '#e0f2fe' : '#f5f5f5'
            e.currentTarget.style.borderColor = isAsesor ? '#0ea5e9' : '#ddd'
          }
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getFileIcon(file.name || '')}
          <span style={{
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {file.name || 'Unknown file'}
          </span>
        </span>
        {/* Eye icon for kebenaran/asesor, Trash for asesi regular files */}
        {(isKebenaran || isAsesor || !disabled) && (
          <button
            onClick={handleButtonClick}
            style={{
              background: 'transparent',
              border: 'none',
              color: (isAsesor || isKebenaran) ? '#0284c7' : '#999',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!isExiting) {
                if (isAsesor || isKebenaran) {
                  e.currentTarget.style.background = '#0284c7'
                  e.currentTarget.style.color = '#fff'
                } else if (!disabled) {
                  e.currentTarget.style.background = '#dc2626'
                  e.currentTarget.style.color = '#fff'
                }
              }
            }}
            onMouseLeave={(e) => {
              if (!isExiting) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = (isAsesor || isKebenaran) ? '#0284c7' : '#999'
              }
            }}
            title={isKebenaran ? "Lihat dokumen kebenaran data" : (isAsesor ? "Lihat preview dokumen" : "Hapus file dari server")}
          >
            {(isAsesor || isKebenaran) ? <Eye size={12} /> : <Trash2 size={12} />}
          </button>
        )}
      </span>
    </>
  )
}

// Helper function to get file icon based on extension
function getFileIcon(fileName: string): React.ReactNode {
  if (!fileName) return <File size={14} style={{ color: '#666' }} />
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return <FileType size={14} style={{ color: '#dc2626' }} />
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <FileImage size={14} style={{ color: '#059669' }} />
  if (['doc', 'docx'].includes(ext || '')) return <FileType size={14} style={{ color: '#2563eb' }} />
  return <File size={14} style={{ color: '#666' }} />
}

// Bukti Dropdown Component with its own state (no full page re-render)
interface BuktiDropdownProps {
  kukId: string
  uploadedFiles: Array<{ id: number; name: string; path: string }>
  selectedFileIds: number[]
  onSelectFile: (kukId: string, fileId: number) => void
  disabled?: boolean
}

function BuktiDropdown({ kukId, uploadedFiles, selectedFileIds, onSelectFile, disabled }: BuktiDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0, width: 0 })
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const toggleDropdown = () => {
    if (disabled || uploadedFiles.length === 0) return

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownHeight = Math.min(uploadedFiles.length * 40 + 20, 180) // Estimate height
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      let top: number
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        // Not enough space below, flip above
        top = rect.top - dropdownHeight - 4
      } else {
        top = rect.bottom + 4
      }

      setMenuPosition({ top, left: rect.left, width: rect.width })
    }
    setIsOpen(!isOpen)
  }

  React.useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const isClickInsideButton = buttonRef.current?.contains(target)
      const isClickInsideMenu = menuRef.current?.contains(target)
      if (!isClickInsideButton && !isClickInsideMenu) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => setIsOpen(false)
    const handleResize = () => setIsOpen(false)

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        disabled={disabled || uploadedFiles.length === 0}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: isOpen ? '1px solid #999' : '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '12px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontWeight: '500',
          backgroundColor: (disabled || uploadedFiles.length === 0) ? '#f5f5f5' : '#fff',
          cursor: (disabled || uploadedFiles.length === 0) ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          color: '#333',
        }}
        onMouseEnter={(e) => {
          if (!disabled && uploadedFiles.length > 0 && !isOpen) {
            e.currentTarget.style.borderColor = '#999'
            e.currentTarget.style.backgroundColor = '#f9f9f9'
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#ddd'
            e.currentTarget.style.backgroundColor = (disabled || uploadedFiles.length === 0) ? '#f5f5f5' : '#fff'
          }
        }}
      >
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          {selectedFileIds.length > 0 && (
            <span style={{
              background: '#666',
              color: '#fff',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '600',
            }}>
              {selectedFileIds.length}
            </span>
          )}
          {selectedFileIds.length > 0 ? 'file dipilih' : (uploadedFiles.length === 0 ? '-- Upload file terlebih dahulu --' : '-- Pilih File --')}
        </span>
        <span style={{
          transition: 'transform 0.3s ease',
          display: 'inline-block',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▼
        </span>
      </button>

      {isOpen && uploadedFiles.length > 0 && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            width: `${menuPosition.width}px`,
            zIndex: 100000,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '6px',
            maxHeight: '180px',
            overflowY: 'auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {uploadedFiles.map((file, index) => {
            const isSelected = selectedFileIds.includes(file.id)
            return (
              <div
                key={file.id}
                onClick={() => {
                  onSelectFile(kukId, file.id)
                  setIsOpen(false)
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  background: isSelected ? '#e8e8e8' : 'transparent',
                  borderBottom: index === uploadedFiles.length - 1 ? 'none' : '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.15s ease',
                  color: '#333',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f5f5f5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <CustomCheckbox
                  checked={isSelected}
                  onChange={() => {}}
                  style={{ pointerEvents: 'none' }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getFileIcon(file.name || '')}
                  <span>{file.name || 'Unknown file'}</span>
                </span>
                {isSelected && (
                  <span style={{
                    marginLeft: 'auto',
                    color: '#666',
                  }}>
                    <Check size={16} />
                  </span>
                )}
              </div>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}

// Document Preview Modal Component
interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  file: { id: number; name: string; path: string } | null
}

function DocumentPreviewModal({ isOpen, onClose, file }: DocumentPreviewModalProps) {
  if (!isOpen || !file) {
    return null
  }

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !file) return

    const loadPreview = async () => {
      setIsLoading(true)
      setError(null)

      const ext = (file.name.includes('.') ? file.name.split('.').pop() : file.path.split('.').pop()?.split('?')[0])?.toLowerCase()

      // For images, show directly
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
        setIsLoading(false)
      } else if (ext === 'pdf') {
        // For PDF, embed directly
        setIsLoading(false)
      } else if (['doc', 'docx'].includes(ext || '')) {
        // For documents, show as downloadable link (can't preview in browser)
        setIsLoading(false)
      } else {
        // For other files, show as downloadable
        setIsLoading(false)
      }
    }

    loadPreview()
  }, [isOpen, file])

  const getExt = () => (file.name.includes('.') ? file.name.split('.').pop() : file.path.split('.').pop()?.split('?')[0])?.toLowerCase()

  const getFileTypeDisplay = () => {
    const ext = getExt()
    if (ext === 'pdf') return 'PDF Document'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'Gambar'
    if (['doc', 'docx'].includes(ext || '')) return 'Document Microsoft Word'
    return 'File'
  }

  const renderPreview = () => {
    const ext = getExt()

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return (
        <img
          src={file.path}
          alt={file.name}
          style={{
            width: '100%',
            maxHeight: '70vh',
            objectFit: 'contain',
            borderRadius: '8px'
          }}
        />
      )
    }

    if (ext === 'pdf') {
      return (
        <iframe
          src={`${file.path}#toolbar=0`}
          title={file.name}
          style={{
            width: '100%',
            height: '70vh',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}
        />
      )
    }

    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#666'
      }}>
        <File size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p style={{ marginBottom: '16px' }}>Preview tidak tersedia untuk jenis file ini</p>
        <p style={{ fontSize: '14px' }}>Silakan download untuk melihat isi file</p>
      </div>
    )
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.8)",
        padding: "16px"
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "900px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Eye style={{ width: "20px", height: "20px", color: "#0066cc" }} />
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", margin: 0 }}>
              {getFileTypeDisplay()}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: "#6b7280"
            }}
          >
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* File Info */}
        <div style={{
          padding: "12px 20px",
          background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <p style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#374151",
            margin: "0",
            wordBreak: "break-all"
          }}>
            {file.name}
          </p>
        </div>

        {/* Preview Content */}
        <div style={{
          flex: 1,
          padding: "20px",
          overflow: "auto",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {isLoading ? (
            <div>Memuat preview...</div>
          ) : error ? (
            <div style={{ color: "#dc2626" }}>{error}</div>
          ) : (
            renderPreview()
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px"
        }}>
          <a
            href={file.path}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "10px 20px",
              background: "#0066cc",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              textDecoration: "none"
            }}
          >
            Download / Open in New Tab
          </a>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

interface KUK {
  no_kuk: string
  judul_kuk: string
}

interface ServerFile {
  id: number
  name: string
  path: string
}

interface BarcodeInfo {
  url: string | null
  tanggal: string | null
  nama: string | null
}

interface SubunitBarcodes {
  asesi: BarcodeInfo
  asesor1: BarcodeInfo | null
  asesor2: BarcodeInfo | null
}

interface Subunit {
  id: string
  no_elemen: string
  judul_elemen: string
  kompeten?: boolean
  kuk_list: KUK[]
  files: ServerFile[]
  barcodes?: SubunitBarcodes
}

interface Unit {
  id: string
  kode: string
  judul_kompetensi: string
  subunits: Subunit[]
}

interface Apl02Response {
  message: string
  data: {
    metode?: 'observasi' | 'portofolio'
    is_dilanjutkan?: boolean
    id_jadwal?: number
    units: Unit[]
    barcodes?: SubunitBarcodes
  }
}

interface DataDokumenResponse {
  message: string
  data: {
    jabatan_kerja: string
    nomor_skema: string
    tuk: string
    asesor_1: string
    asesor_2: string
    noreg_asesor_1: string
    noreg_asesor_2: string
    tanggal_uji: string
    tanggal_selesai: string | null
    jenis_kelas: string
    nama_asesi?: string
  }
}

type Apl02Data = {
  jabatan_kerja: string
  no_skema: string
  tuk: string
  nama_asesor: string
  nama_asesi: string
  tanggal: string
  metode?: 'observasi' | 'portofolio'
  is_dilanjutkan?: boolean
  units: Unit[]
}

// Floating modal for selecting doc type before upload
function FileTypeModal({
  isOpen,
  stagingFiles,
  fileDocTypes,
  setFileDocTypes,
  fileCustomTypes,
  setFileCustomTypes,
  isUploading,
  onClose,
  onUpload,
}: {
  isOpen: boolean
  stagingFiles: ServerFile[]
  fileDocTypes: Record<string, string>
  setFileDocTypes: React.Dispatch<React.SetStateAction<Record<string, string>>>
  fileCustomTypes: Record<string, string>
  setFileCustomTypes: React.Dispatch<React.SetStateAction<Record<string, string>>>
  isUploading: boolean
  onClose: () => void
  onUpload: () => void
}) {
  if (!isOpen) return null

  const DOC_TYPES = ['Ijazah', 'Referensi Kerja', 'Sertifikat Pelatihan', 'Laporan Pekerjaan', 'Dokumentasi Pekerjaan', 'Lainnya'] as const

  const isValid = () => stagingFiles.every((_, idx) => {
    const dt = fileDocTypes[String(idx)]
    if (!dt) return false
    if (dt === 'Lainnya') {
      const custom = fileCustomTypes[String(idx)]?.trim() || ''
      if (!custom) return false
      if (/[^a-zA-Z0-9\s]/.test(custom)) return false
      return true
    }
    return true
  })

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', padding: '24px',
        maxWidth: '480px', width: '100%', maxHeight: '80vh', overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 12px 0', color: '#1e293b' }}>
          Pilih Jenis Dokumen
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>
          Tentukan jenis dokumen untuk setiap file yang akan diupload.
        </p>

        {stagingFiles.map((file, idx) => {
          const key = String(idx)
          const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : ''
          const selectedType = fileDocTypes[key]
          const displayName = selectedType
            ? (selectedType === 'Lainnya'
                ? (fileCustomTypes[key]?.trim() || file.name)
                : selectedType + ext)
            : file.name

          return (
            <div key={key} style={{
              border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '12px', marginBottom: '12px', background: '#f8fafc',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M4 1L4 15H12V5L8 1H4Z" fill="#94a3b8" stroke="#64748b" strokeWidth="1"/>
                  <path d="M8 1V5H12" fill="#cbd5e1" stroke="#64748b" strokeWidth="1"/>
                </svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
              </div>
              <select
                value={fileDocTypes[key] || ''}
                onChange={(e) => {
                  setFileDocTypes(prev => ({ ...prev, [key]: e.target.value }))
                  if (e.target.value !== 'Lainnya') {
                    setFileCustomTypes(prev => {
                      const next = { ...prev }
                      delete next[key]
                      return next
                    })
                  }
                }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#fff', color: fileDocTypes[key] ? '#1e293b' : '#94a3b8', outline: 'none' }}
              >
                <option value="">-- Pilih Jenis Dokumen --</option>
                {DOC_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
              </select>
              {fileDocTypes[key] === 'Lainnya' && (
                <input
                  type="text" placeholder="Tuliskan jenis dokumen..."
                  value={fileCustomTypes[key] || ''}
                  onChange={(e) => setFileCustomTypes(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', marginTop: '8px', boxSizing: 'border-box', outline: 'none' }}
                />
              )}
            </div>
          )
        })}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#64748b', fontSize: '14px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer' }}>
            Batal
          </button>
          <button onClick={onUpload} disabled={isUploading || !isValid()} style={{ padding: '10px 20px', border: 'none', backgroundColor: (isUploading || !isValid()) ? '#94a3b8' : '#00488f', color: '#fff', fontSize: '14px', fontWeight: '600', borderRadius: '8px', cursor: (isUploading || !isValid()) ? 'not-allowed' : 'pointer' }}>
            {isUploading ? 'Mengupload...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Memoized KUK row � only re-renders when its own state changes
const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("access_token")
  const h: Record<string, string> = { "Accept": "application/json" }
  if (token) h["Authorization"] = `Bearer ${token}`
  return h
}

export default function Apl02Page() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { kegiatan, isAsesor } = useKegiatanByRole()
  const { idIzin: idIzinFromUrl } = useParams<{ idIzin: string }>()

  const isUuidSession = !!sessionStorage.getItem("praasesmen_uuid_data")
  // Use idIzin from URL when accessed by asesor or UUID flow, otherwise use from user context
  const idIzin = isUuidSession ? idIzinFromUrl : (isAsesor ? idIzinFromUrl : user?.id_izin)
  const { asesorList, namaAsesi, jenjang, tahap, jadwalId } = useDataDokumenPraAsesmen(idIzin)
  const { showSuccess, showError, showWarning } = useToast()

  // UUID flow only valid at tahap 0
  const isUuidFlow = isUuidSession && (tahap === 0 || tahap === undefined)

  const [apl02Data, setApl02Data] = useState<Apl02Data | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const apl02DataRef = useRef<Apl02Data | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [_idIzin, setIdIzin] = useState<string | null>(null) // Will be used for POST request

  const [uploadedFilesInfo, setUploadedFilesInfo] = useState<Array<{ id: number; name: string; path: string; kebenaran?: boolean }>>([])
  const [filePanelRefreshKey, setFilePanelRefreshKey] = useState(0)
  const [kukChecklist, setKukChecklist] = useState<Record<string, 'K' | 'BK' | null>>({})
  const [kukBukti, setKukBukti] = useState<Record<string, number[]>>({}) // Store file IDs instead of names
  const [excludedApiFileIds, setExcludedApiFileIds] = useState<Set<string>>(new Set()) // API files excluded from POST — composite key `${unitId}-${subunitId}-${fileId}`
  // metodeAsesmen moved to RekomendasiAsesiSection - use ref for POST value
  const metodeAsesmenRef = useRef<'observasi' | 'portofolio' | null>(null)
  const [subunitBarcodes, setSubunitBarcodes] = useState<Record<string, SubunitBarcodes>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<{ id: number; name: string; path: string } | null>(null)

  // File type modal state
  const [showFileTypeModal, setShowFileTypeModal] = useState(false)

  // Prevent layout shift from scrollbar appearing/disappearing
  useEffect(() => {
    const prev = document.body.style.overflowY
    document.body.style.overflowY = 'scroll'
    return () => { document.body.style.overflowY = prev }
  }, [])
  // stagingFiles holds raw File objects from client � no upload until user confirms
  const [stagingFiles, setStagingFiles] = useState<ServerFile[]>([])
  const [fileDocTypes, setFileDocTypes] = useState<Record<string, string>>({}) // client index -> doc type
  const [fileCustomTypes, setFileCustomTypes] = useState<Record<string, string>>({}) // client index -> custom text for "Lainnya"
  const [isUploading, setIsUploading] = useState(false)

  // Stable callbacks for memoized KukRow children
  const onViewFile = useCallback((file: { id: number; name: string; path: string }) => {
    setSelectedPreviewFile(file)
    setShowPreview(true)
  }, [])

  const handleClosePreview = useCallback(() => {
    setShowPreview(false)
    setSelectedPreviewFile(null)
  }, [])

  const handleNavigateBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  // Handle metode asesmen change from RekomendasiAsesiSection
  const handleMetodeChange = useCallback((metode: 'observasi' | 'portofolio' | null) => {
    metodeAsesmenRef.current = metode
  }, [])

  const handleToggleExclude = useCallback((unitId: string, subunitId: string, fileId: number) => {
    const key = `${unitId}-${subunitId}-${fileId}`
    setExcludedApiFileIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) newSet.delete(key)
      else newSet.add(key)
      return newSet
    })
  }, [])

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  // Note: asesorList is available after useDataDokumenPraAsesmen is called
  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'praasesmen',
    role: 'auto',
    checkOnMount: true, // Enable for both asesi and asesor
    idIzin: idIzin,
    asesorList: asesorList,
    tahap: tahap
  })

  const handleCheckboxChange = useCallback((kukId: string, value: 'K' | 'BK' | null, unitId?: string, subunitId?: string, globalMode?: boolean) => {
    setKukChecklist(prev => {
      const current = prev[kukId]

      // Jika value null (uncheck) dan current sudah null, atau value sama dengan current, skip
      if (value === null && !current) return prev
      if (value && current === value) return prev

      if (current === value) {
        // Uncheck if clicking the same value
        const { [kukId]: _, ...rest } = prev

        if (globalMode && apl02DataRef.current) {
          // Global mode: uncheck ALL KUKs in ALL units/subunits
          apl02DataRef.current.units.forEach(unit => {
            unit.subunits.forEach(subunit => {
              subunit.kuk_list.forEach(kuk => {
                const otherKukId = `${unit.id}-${subunit.id}-${kuk.no_kuk}`
                if (otherKukId !== kukId) {
                  delete rest[otherKukId]
                }
              })
            })
          })
        } else if (unitId && subunitId && apl02DataRef.current) {
          // Local mode: uncheck KUKs in same subunit only
          const unit = apl02DataRef.current.units.find(u => u.id === unitId)
          if (unit) {
            const subunit = unit.subunits.find(s => s.id === subunitId)
            if (subunit) {
              subunit.kuk_list.forEach(kuk => {
                const otherKukId = `${unitId}-${subunitId}-${kuk.no_kuk}`
                if (otherKukId !== kukId) {
                  delete rest[otherKukId]
                }
              })
            }
          }
        }
        return rest
      }

      // Set value for this KUK
      if (value === null) {
        const { [kukId]: _, ...rest } = prev
        return rest
      }
      const updated = { ...prev, [kukId]: value }

      if (globalMode && apl02DataRef.current) {
        // Global mode: set ALL KUKs in ALL units/subunits
        apl02DataRef.current.units.forEach(unit => {
          unit.subunits.forEach(subunit => {
            subunit.kuk_list.forEach(kuk => {
              const otherKukId = `${unit.id}-${subunit.id}-${kuk.no_kuk}`
              updated[otherKukId] = value
            })
          })
        })
      } else if (unitId && subunitId && apl02DataRef.current) {
        // Local mode: set KUKs in same subunit only
        const unit = apl02DataRef.current.units.find(u => u.id === unitId)
        if (unit) {
          const subunit = unit.subunits.find(s => s.id === subunitId)
          if (subunit) {
            subunit.kuk_list.forEach(kuk => {
              const otherKukId = `${unitId}-${subunitId}-${kuk.no_kuk}`
              updated[otherKukId] = value
            })
          }
        }
      }
      return updated
    })
  }, []) // No dependencies - uses ref instead

  const handleBuktiChange = useCallback((kukId: string, fileId: number, unitId?: string, subunitId?: string) => {
    setKukBukti(prev => {
      const currentFiles = prev[kukId] || []
      const isRemoving = currentFiles.includes(fileId)

      if (isRemoving) {
        // Remove file from this KUK only
        return {
          ...prev,
          [kukId]: currentFiles.filter(f => f !== fileId)
        }
      } else {
        // Add file to this KUK and all KUKs in the same element
        const updated = {
          ...prev,
          [kukId]: [...currentFiles, fileId]
        }

        // Auto-assign to all KUKs in the same element
        if (unitId && subunitId && apl02DataRef.current) {
          const unit = apl02DataRef.current.units.find(u => u.id === unitId)
          if (unit) {
            const subunit = unit.subunits.find(s => s.id === subunitId)
            if (subunit) {
              subunit.kuk_list.forEach(kuk => {
                const otherKukId = `${unitId}-${subunitId}-${kuk.no_kuk}`
                if (otherKukId !== kukId) {
                  const otherFiles = updated[otherKukId] || []
                  if (!otherFiles.includes(fileId)) {
                    updated[otherKukId] = [...otherFiles, fileId]
                  }
                }
              })
            }
          }
        }

        return updated
      }
    })
  }, []) // No dependencies - uses ref instead

  // Stable callbacks for KukRow � defined after handleCheckboxChange & handleBuktiChange
  const handleCheckRadio = useCallback((kukId: string, value: 'K' | 'BK' | null, unitId: string, subunitId: string) => {
    handleCheckboxChange(kukId, value, unitId, subunitId)
  }, [handleCheckboxChange])

  const handleRemoveBukti = useCallback((kukId: string, fileId: number, unitId?: string, subunitId?: string) => {
    setKukBukti(prev => {
      const updated = { ...prev }

      // Remove from this KUK first
      updated[kukId] = (prev[kukId] || []).filter(f => f !== fileId)

      // Also remove from all KUKs in the same element
      if (unitId && subunitId && apl02DataRef.current) {
        const unit = apl02DataRef.current.units.find(u => u.id === unitId)
        if (unit) {
          const subunit = unit.subunits.find(s => s.id === subunitId)
          if (subunit) {
            subunit.kuk_list.forEach(kuk => {
              const otherKukId = `${unitId}-${subunitId}-${kuk.no_kuk}`
              if (otherKukId !== kukId) {
                updated[otherKukId] = (prev[otherKukId] || []).filter(f => f !== fileId)
              }
            })
          }
        }
      }

      return updated
    })
  }, [])

  const handleSelectBukti = useCallback((kukId: string, fileId: number, unitId: string, subunitId: string) => {
    handleBuktiChange(kukId, fileId, unitId, subunitId)
  }, [handleBuktiChange])

  const deleteFile = async (fileId: number) => {
    // Kebenaran data files (negative IDs) are read-only, cannot be deleted
    if (fileId < 0) return

    try {
      const token = isUuidFlow ? null : localStorage.getItem("access_token")

      const response = await fetch(`${API_BASE_URL}/praasesmen/apl02/files/${fileId}`, {
        method: 'DELETE',
        headers: isUuidFlow ? authHeaders() : {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Remove from uploadedFilesInfo
        setUploadedFilesInfo(prev => prev.filter(f => f.id !== fileId))
        // Preserve file selections per bukti; do not remove from kukBukti on delete
        // setKukBukti(prev => {
        //   const newKukBukti = { ...prev }
        //   Object.keys(newKukBukti).forEach(kukId => {
        //     newKukBukti[kukId] = newKukBukti[kukId].filter(id => id !== fileId)
        //   })
        //   return newKukBukti
        // })
        showSuccess('File berhasil dihapus')
      } else if (response.status === 404) {
        // File not found on server - remove from local state anyway
        setUploadedFilesInfo(prev => prev.filter(f => f.id !== fileId))
        setKukBukti(prev => {
          const newKukBukti = { ...prev }
          Object.keys(newKukBukti).forEach(kukId => {
            newKukBukti[kukId] = newKukBukti[kukId].filter(id => id !== fileId)
          })
          return newKukBukti
        })
      } else {
        const msg = await extractApiError(response, 'Gagal menghapus file')
        showError(msg)
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      showError(extractErrorMessage(error, 'Terjadi kesalahan saat menghapus file'))
    }
  }

  const uploadFiles = async (fileList: FileList | null): Promise<void> => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList)
    // Stage files client-side, open modal for doc type selection before upload
    setStagingFiles(files as unknown as ServerFile[])
    setFileDocTypes({})
    setFileCustomTypes({})
    setShowFileTypeModal(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    uploadFiles(e.target.files)
    e.target.value = ''
  }

  const handleUploadFiles = async () => {
    const isValid = stagingFiles.every((_, idx) => {
      const dt = fileDocTypes[String(idx)]
      if (!dt) return false
      if (dt === 'Lainnya') {
        const custom = fileCustomTypes[String(idx)]?.trim() || ''
        if (!custom) return false
        if (/[^a-zA-Z0-9\s]/.test(custom)) return false
        return true
      }
      return true
    })
    if (!isValid) {
      showWarning('Pilih jenis dokumen untuk semua file (Lainnya: minimal 1 kata, tanpa simbol)')
      return
    }
    setIsUploading(true)
    try {
      const token = isUuidFlow ? null : localStorage.getItem("access_token")
      const finalIdIzin = _idIzin || idIzin
      if (!finalIdIzin) {
        showWarning("ID Izin tidak ditemukan")
        return
      }
      const renamedFiles = stagingFiles.map((f, idx) => {
        const ext = f.name.includes('.') ? '.' + f.name.split('.').pop() : ''
        const dtype = fileDocTypes[String(idx)]
        let newName = f.name
        if (dtype === 'Lainnya') {
          const custom = fileCustomTypes[String(idx)]?.trim()
          if (custom) newName = custom + ext
        } else if (dtype) {
          newName = dtype + ext
        }
        return new globalThis.File([f as unknown as Blob], newName, { type: (f as unknown as { type: string }).type })
      })
      const filetypes = stagingFiles.map((f, idx) => {
        const ext = f.name.includes('.') ? f.name.split('.').pop()! : ''
        const dtype = fileDocTypes[String(idx)]
        if (dtype === 'Lainnya') {
          return fileCustomTypes[String(idx)]?.trim() || f.name.replace(`.${ext}`, '')
        } else if (dtype) {
          return dtype
        }
        return f.name.replace(`.${ext}`, '')
      })
      const formData = new FormData()
      renamedFiles.forEach((file, idx) => {
        formData.append('files[]', file)
        formData.append('filetypes[]', filetypes[idx].toLowerCase().replace(/\s+/g, '_'))
      })
      const uploadResponse = await fetch(`${API_BASE_URL}/praasesmen/${finalIdIzin}/apl02/files`, {
        method: 'POST',
        headers: isUuidFlow ? authHeaders() : { "Accept": "application/json", "Authorization": `Bearer ${token}` },
        body: formData,
      })
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json()
        if (uploadResult.message === "Files uploaded" && uploadResult.files) {
          const getFileUrl = (p: string) => {
            if (p.startsWith('http://') || p.startsWith('https://')) return p
            const fileBase = import.meta.env.VITE_FILE_BASE_URL || API_BASE_URL.replace('/api', '')
            return `${fileBase}${p.startsWith('/') ? '' : '/'}${p}`
          }
          const mappedFiles = uploadResult.files.map((f: any) => ({
            id: f.id, name: f.original_name || f.name, path: getFileUrl(f.path)
          }))
          setUploadedFilesInfo(prev => [...prev, ...mappedFiles])
          await fetchData()
          setFilePanelRefreshKey(prev => prev + 1)
          showSuccess(`${stagingFiles.length} file berhasil diupload`)
        }
      } else {
        const msg = await extractApiError(uploadResponse, 'Gagal upload file')
        showError(msg)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      showError(extractErrorMessage(error, 'Terjadi kesalahan saat upload file'))
    } finally {
      setIsUploading(false)
      setShowFileTypeModal(false)
      setStagingFiles([])
      setFileDocTypes({})
      setFileCustomTypes({})
    }
  }

  const handleCloseFileModal = () => {
    setShowFileTypeModal(false)
    setStagingFiles([])
    setFileDocTypes({})
    setFileCustomTypes({})
  }

  const initialFetchDone = useRef(false)

  const fetchData = useCallback(async () => {
      try {
        // Use idIzin from URL when accessed by asesor or UUID flow, otherwise use from user context
        const idIzin = (isAsesor || isUuidFlow) ? idIzinFromUrl : user?.id_izin

        // Fetch id_izin dari list-asesi endpoint (skip for asesor)
        let fetchedIdIzin: string | null = idIzin || null

        if (!fetchedIdIzin && !isAsesor && jadwalId) {
          const listAsesiResponse = await fetch(`${API_BASE_URL}/kegiatan/${jadwalId}/list-asesi`, {
            headers: authHeaders(),
          })

          if (listAsesiResponse.ok) {
            const listResult = await listAsesiResponse.json()
            if (listResult.message === "Success" && listResult.list_asesi && listResult.list_asesi.length > 0) {
              fetchedIdIzin = listResult.list_asesi[0].id_izin
              setIdIzin(fetchedIdIzin)
            }
          }
        }

        if (!fetchedIdIzin) {
          return
        }

        // Fetch data-dokumen, apl02, files, and dokumen-asesi in parallel
        const h = authHeaders()
        const [dataDokumenResponse, apl02Response, filesResponse, dokumenAsesiResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/praasesmen/${fetchedIdIzin}/data-dokumen`, { headers: h }),
          fetch(`${API_BASE_URL}/praasesmen/${fetchedIdIzin}/apl02`, { headers: h }),
          fetch(`${API_BASE_URL}/praasesmen/${fetchedIdIzin}/apl02/files`, { headers: h }),
          fetch(`${API_BASE_URL}/kegiatan/${fetchedIdIzin}/dokumen-asesi`, { headers: h }),
        ])

        // Parse data-dokumen response
        let jabatanKerja = ''
        let noSkema = ''
        let tuk = 'Sewaktu / Tempat Kerja / Mandiri'
        let namaAsesor = ''
        let namaAsesiFromApi = ''

        if (dataDokumenResponse.ok) {
          const dataDokumenResult: DataDokumenResponse = await dataDokumenResponse.json()
          if (dataDokumenResult.message === "Success" && dataDokumenResult.data) {
            jabatanKerja = dataDokumenResult.data.jabatan_kerja || ''
            noSkema = dataDokumenResult.data.nomor_skema || ''
            tuk = dataDokumenResult.data.tuk || 'Sewaktu / Tempat Kerja / Mandiri'
            // Combine asesor 1 and 2
            namaAsesor = dataDokumenResult.data.asesor_1
              ? dataDokumenResult.data.asesor_2
                ? `${dataDokumenResult.data.asesor_1}, ${dataDokumenResult.data.asesor_2}`
                : dataDokumenResult.data.asesor_1
              : ''
            namaAsesiFromApi = dataDokumenResult.data.nama_asesi || ''
          }
        }

        // Parse apl02 response
        let units: Unit[] = []
        let metodeFromApi: 'observasi' | 'portofolio' | undefined
        let barcodesFromApi: SubunitBarcodes | undefined
        let isDilanjutkanFromApi: boolean | undefined

        if (apl02Response.ok) {
          const apl02Result: Apl02Response = await apl02Response.json()
          if (apl02Result.message === "Success" && apl02Result.data) {
            units = apl02Result.data.units || []
            metodeFromApi = apl02Result.data.metode
            barcodesFromApi = apl02Result.data.barcodes
            isDilanjutkanFromApi = apl02Result.data.is_dilanjutkan

            // Map subunit.kompeten to kukChecklist
            const newKukChecklist: Record<string, 'K' | 'BK' | null> = {}
            const newSubunitBarcodes: Record<string, SubunitBarcodes> = {}
            units.forEach(unit => {
              unit.subunits.forEach(subunit => {
                if (subunit.kompeten !== undefined && subunit.kompeten !== null) {
                  // Set same status for all KUKs in this subunit
                  subunit.kuk_list.forEach(kuk => {
                    const kukId = `${unit.id}-${subunit.id}-${kuk.no_kuk}`
                    newKukChecklist[kukId] = subunit.kompeten ? 'K' : 'BK'
                  })
                }
                // Store barcodes per subunit (prefer subunit-level barcodes, fallback to API-level)
                if (subunit.barcodes) {
                  newSubunitBarcodes[subunit.id] = subunit.barcodes
                } else if (barcodesFromApi) {
                  newSubunitBarcodes[subunit.id] = barcodesFromApi
                }
              })
            })

            // Only set if there are saved answers
            if (Object.keys(newKukChecklist).length > 0) {
              setKukChecklist(newKukChecklist)
            }
            // Set barcodes
            if (Object.keys(newSubunitBarcodes).length > 0) {
              setSubunitBarcodes(newSubunitBarcodes)
            }
          }
        }

        // Parse files response
        if (filesResponse.ok) {
          const filesResult = await filesResponse.json()
          if (filesResult.message === "Success" && filesResult.data) {
            const getFileUrl = (p: string) => {
              if (p.startsWith('http://') || p.startsWith('https://')) return p
              const fileBase = import.meta.env.VITE_FILE_BASE_URL || API_BASE_URL.replace('/api', '')
              return `${fileBase}${p.startsWith('/') ? '' : '/'}${p}`
            }
            const mappedFiles = filesResult.data.map((f: any) => ({
              id: f.id, name: f.original_name || f.name, path: getFileUrl(f.path)
            }))
            setUploadedFilesInfo(mappedFiles)
          }
        }

        // Parse dokumen-asesi response and inject ijazah + referensi_kerja
        // Skip if asesi QR already exists (prevents re-selection creating duplicates)
        const sudahDitandatangani = barcodesFromApi?.asesi?.url != null
        if (dokumenAsesiResponse.ok && !sudahDitandatangani) {
          try {
            const dokumenAsesiResult = await dokumenAsesiResponse.json()
            const data = dokumenAsesiResult.data || dokumenAsesiResult
            if (data) {
              const dokumenFiles: Array<{ id: number; name: string; path: string; kebenaran: boolean }> = []
              if (data.ijazah) {
                dokumenFiles.push({ id: -1, name: 'Ijazah', path: data.ijazah, kebenaran: true })
              }
              if (data.referensi_kerja) {
                dokumenFiles.push({ id: -2, name: 'Referensi Kerja', path: data.referensi_kerja, kebenaran: true })
              }
              if (dokumenFiles.length > 0) {
                setUploadedFilesInfo(prev => {
                  const existingIds = new Set(prev.map(f => f.id))
                  const newFiles = dokumenFiles.filter(f => !existingIds.has(f.id))
                  return [...newFiles, ...prev]
                })
              }
            }
          } catch { /* ignore parse errors */ }
        }

        // Set metode from API - default to observasi if not set
        if (metodeFromApi) {
          metodeAsesmenRef.current = metodeFromApi
        } else {
          metodeAsesmenRef.current = null // No selection until asesor chooses
        }

        // Set combined data
        setApl02Data({
          jabatan_kerja: jabatanKerja,
          no_skema: noSkema,
          tuk: tuk,
          nama_asesor: namaAsesor,
          nama_asesi: namaAsesiFromApi || namaAsesi || user?.name || '',
          tanggal: new Date().toLocaleDateString('id-ID'),
          metode: metodeFromApi,
          is_dilanjutkan: isDilanjutkanFromApi,
          units: units,
        })
        setIsDataLoading(false)
        apl02DataRef.current = {
          jabatan_kerja: jabatanKerja,
          no_skema: noSkema,
          tuk: tuk,
          nama_asesor: namaAsesor,
          nama_asesi: namaAsesiFromApi || namaAsesi || user?.name || '',
          tanggal: new Date().toLocaleDateString('id-ID'),
          metode: metodeFromApi,
          is_dilanjutkan: isDilanjutkanFromApi,
          units: units,
        }
      } catch (error) {
        setIsDataLoading(false)
      }
  }, [kegiatan, user, isAsesor, idIzinFromUrl, jadwalId])

  useEffect(() => {
    if (initialFetchDone.current) return
    if ((isAsesor && idIzin) || isUuidFlow || kegiatan || jadwalId) {
      initialFetchDone.current = true
      window.scrollTo(0, 0)
      fetchData()
    }
  }, [kegiatan, isAsesor, idIzin, jadwalId, fetchData])

  // Check if asesi has signed (skip untuk tahap 0)
  const asesiHasSigned = (() => {
    if (tahap === 0 || isUuidFlow) return true
    if (isAsesor) return true
    const subunits = Object.values(subunitBarcodes)
    if (subunits.length === 0) return false
    return subunits.some(sb => sb.asesi?.url)
  })()

  // Check if asesor has signed (for current asesor, skip untuk tahap 0)
  const asesorHasSigned = (() => {
    if (tahap === 0) return true
    if (!isAsesor) return true
    const asesorIndex = asesorList.findIndex(a => String(a.id) === String(user?.id))
    const isAsesor1 = asesorIndex === 0 || asesorIndex === -1
    const firstSubunitId = Object.keys(subunitBarcodes)[0]
    if (!firstSubunitId) return false
    const barcode = subunitBarcodes[firstSubunitId]
    return isAsesor1 ? !!barcode?.asesor1?.url : !!barcode?.asesor2?.url
  })()

  // Check if all asesor signatures exist across all subunits (skip untuk tahap 0)
  const allAsesorSigned = (() => {
    if (tahap === 0 || isUuidFlow) return true
    if (isAsesor) return true
    if (asesorList.length === 0) return false // Asesi: need asesor data first
    const subunits = Object.values(subunitBarcodes)
    if (subunits.length === 0) return false
    return subunits.every(sb => {
      if (!sb.asesor1?.url) return false
      if (asesorList.length >= 2 && !sb.asesor2?.url) return false
      return true
    })
  })()

  // allSigned & missingLabels now handled by useSigningState hook

  // Derive single barcode state from per-subunit barcodes for signing hook
  const syntheticBarcodes = useMemo((): SubunitBarcodes | null => {
    const items = Object.values(subunitBarcodes)
    if (items.length === 0) return null
    return {
      asesi: items.find(b => b.asesi?.url)?.asesi || { url: null, tanggal: null, nama: null },
      asesor1: items.find(b => b.asesor1?.url)?.asesor1 || null,
      asesor2: items.find(b => b.asesor2?.url)?.asesor2 || null,
    }
  }, [subunitBarcodes])

  const handleSetSyntheticBarcodes = useCallback((value: React.SetStateAction<SubunitBarcodes | null>) => {
    setSubunitBarcodes(prev => {
      // Build synthetic prev for the hook's state updater
      const syntheticPrev: SubunitBarcodes | null = (() => {
        const items = Object.values(prev)
        if (items.length === 0) return null
        return {
          asesi: items.find(b => b.asesi?.url)?.asesi || { url: null, tanggal: null, nama: null },
          asesor1: items.find(b => b.asesor1?.url)?.asesor1 || null,
          asesor2: items.find(b => b.asesor2?.url)?.asesor2 || null,
        }
      })()
      const resolved = typeof value === 'function' ? value(syntheticPrev) : value
      if (!resolved) return prev
      const subunitIds = Object.keys(prev)
      if (subunitIds.length === 0) return prev
      const updated = { ...prev }
      subunitIds.forEach(sid => {
        const existing = updated[sid]
        updated[sid] = {
          asesi: (resolved.asesi?.url ? resolved.asesi : existing?.asesi) || { url: null, tanggal: null, nama: null },
          asesor1: resolved.asesor1 !== undefined ? resolved.asesor1 : existing?.asesor1 ?? null,
          asesor2: resolved.asesor2 !== undefined ? resolved.asesor2 : existing?.asesor2 ?? null,
        }
      })
      return updated
    })
  }, [])

  // Signing state hook � provides realtime sync (publishUpdate) and agreedChecklist state
  const signing = useSigningState({
    pageKey: 'apl02',
    isAsesor,
    tahap,
    barcodes: syntheticBarcodes as any,
    setBarcodes: handleSetSyntheticBarcodes as any,
    asesorList,
    userId: user?.id,
    userName: user?.name,
    isSaving,
    idIzin: _idIzin || idIzin || undefined,
    jadwalId,
    isUuidFlow,
    testingMode: false,
    onRefresh: fetchData,
  })

  const handleToggleAgreement = useCallback(() => {
    signing.setAgreedChecklist(!signing.agreedChecklist)
  }, [signing])

  // Check if asesi is tidak kompeten on any subunit based on kukChecklist
  const isAsesiTidakKompeten = () => {
    if (!apl02Data?.units) return false
    return apl02Data.units.some(unit =>
      unit.subunits.some(subunit => {
        const kukIds = subunit.kuk_list.map(kuk => `${unit.id}-${subunit.id}-${kuk.no_kuk}`)
        return kukIds.some(kukId => kukChecklist[kukId] === 'BK')
      })
    )
  }

  const getNextRoute = (id: string) => {
    const base = isUuidFlow ? '/praasesmen' : '/asesi/praasesmen'
    if (isAsesiTidakKompeten()) return `${base}/${id}/apl02/failed`
    return `${base}/${id}/${isUuidFlow ? 'apl02/success' : 'muk'}`
  }

  const handleSubmit = async () => {
    if (!signing.agreedChecklist) {
      showWarning("Silakan centang pernyataan bahwa Anda telah memahami dokumen ini.")
      return
    }

    // Jika asesi sudah ttd & semua asesor sudah ttd ? redirect ke halaman berikutnya (skip untuk tahap 0)
    if (tahap !== 0 && !isUuidFlow && !isAsesor && asesiHasSigned && allAsesorSigned) {
      const finalIdIzin = _idIzin || idIzin
      if (finalIdIzin) {
        navigate(getNextRoute(finalIdIzin))
      }
      return
    }

    // Jika asesor sudah ttd ? redirect ke halaman berikutnya (skip untuk tahap 0)
    if (tahap !== 0 && isAsesor && asesorHasSigned) {
      const finalIdIzin = idIzinFromUrl || _idIzin
      if (finalIdIzin) {
        navigate(`${isUuidFlow ? '/praasesmen' : '/asesi/praasesmen'}/${finalIdIzin}/${isUuidFlow ? 'apl02/success' : 'muk'}`)
      }
      return
    }

    // Jika asesor, POST metode lalu generate QR
    if (isAsesor) {
      const finalIdIzin = idIzinFromUrl || _idIzin
      if (!finalIdIzin) {
        showWarning("ID Izin tidak ditemukan")
        return
      }

      // Validasi: asesor harus memilih metode asesmen
      if (!metodeAsesmenRef.current) {
        showWarning("Silakan pilih metode asesmen (Observasi atau Portofolio)")
        return
      }

      setIsSaving(true)
      try {
        // Build answers: include file_ids + file_urls so backend tidak error
        // (file tidak boleh kosong). Logic sama dengan flow asesi.
        const dedupByUrl = (arr: { url: string; name: string }[]) => {
          const seen = new Set<string>()
          return arr.filter(item => {
            if (seen.has(item.url)) return false
            seen.add(item.url)
            return true
          })
        }

        const asesorAnswers = apl02Data ? apl02Data.units.flatMap(unit =>
          unit.subunits.map(subunit => {
            const subunitId = parseInt(subunit.id)
            const fileIds = new Set<number>()
            const fileUrls: { url: string; name: string }[] = []

            // Regular API files dari subunit (tidak di-exclude)
            subunit.files.forEach(file => {
              if (!excludedApiFileIds.has(`${unit.id}-${subunit.id}-${file.id}`)) {
                fileIds.add(file.id)
              }
            })

            // Kebeneran/dokumen asesi dari kukBukti pilihan user (url-based)
            Object.entries(kukBukti).forEach(([kukId, ids]) => {
              const parts = kukId.split('-')
              if (parseInt(parts[1]) !== subunitId) return
              ids.forEach(id => {
                if (excludedApiFileIds.has(String(id))) return
                const fInfo = uploadedFilesInfo.find(f => f.id === id)
                if (!fInfo) return
                if (fInfo.kebenaran || id < 0) {
                  if (fInfo.path) fileUrls.push({ url: fInfo.path, name: fInfo.name })
                } else {
                  fileIds.add(id)
                }
              })
            })

            return {
              subunit_id: subunitId,
              kompeten: subunit.kompeten ?? true,
              file_ids: Array.from(fileIds),
              file_urls: dedupByUrl(fileUrls)
            }
          })
        ) : []

        // POST metode ke apl02 endpoint
        const metodeResponse = await fetch(`${API_BASE_URL}/praasesmen/${finalIdIzin}/apl02`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metode: metodeAsesmenRef.current,
            is_dilanjutkan: true,
            answers: asesorAnswers
          }),
        })

        if (!metodeResponse.ok) {
          const errMsg = await extractApiError(metodeResponse, 'Gagal menyimpan metode asesmen')
          showError(errMsg)
          return
        }

        // Generate QR via signing hook (handles API call, state update, Ably publish)
        if (tahap !== 0) {
          const qrOk = await signing.generateQR()
          if (qrOk) {
            showSuccess('Dokumen berhasil ditandatangani!')
          } else {
            showSuccess('Metode asesmen berhasil disimpan!')
          }
          // Navigate after save + QR attempt
          setTimeout(() => navigate(`${isUuidFlow ? '/praasesmen' : '/asesi/praasesmen'}/${finalIdIzin}/${isUuidFlow ? 'apl02/success' : 'muk'}`), 500)
        } else {
          showSuccess('Metode asesmen berhasil disimpan!')
          setTimeout(() => navigate(`${isUuidFlow ? '/praasesmen' : '/asesi/praasesmen'}/${finalIdIzin}/${isUuidFlow ? 'apl02/success' : 'muk'}`), 500)
        }
      } catch (error) {
        console.error('Error saving metode:', error)
        showError(extractErrorMessage(error, 'Gagal menyimpan metode asesmen'))
      } finally {
        setIsSaving(false)
      }
      return
    }

    // Asesi - save data dulu
    const finalIdIzin = _idIzin || idIzin
    if (!finalIdIzin) {
      showWarning("ID Izin tidak ditemukan")
      return
    }

    // Convert kukChecklist to answers array (per subunit)
    // First, collect all KUK data grouped by subunit
    const subunitDataMap = new Map<number, { statuses: ('K' | 'BK')[]; allFileIds: Set<number>; allFileUrls: { url: string; name: string }[] }>()

    Object.entries(kukChecklist).forEach(([kukId, status]) => {
      // kukId format: "unitId-subunitId-kukNo"
      if (status === null) return // Skip null values
      const parts = kukId.split('-')
      const subunitId = parseInt(parts[1])

      if (!subunitDataMap.has(subunitId)) {
        subunitDataMap.set(subunitId, { statuses: [], allFileIds: new Set(), allFileUrls: [] })
      }

      const data = subunitDataMap.get(subunitId)
      if (!data) {
        subunitDataMap.set(subunitId, { statuses: [status], allFileIds: new Set(), allFileUrls: [] })
        return
      }
      data.statuses.push(status)

      // Add user-selected file IDs (filter out excluded API files)
      const fileIds = kukBukti[kukId] || []
      fileIds.forEach(id => {
        if (excludedApiFileIds.has(String(id))) return
        const fInfo = uploadedFilesInfo.find(f => f.id === id)
        if (!fInfo) return
        if (fInfo.kebenaran || id < 0) {
          // Dokumen asesi: only file_urls, no file_ids (fake negative IDs)
          if (fInfo.path) data.allFileUrls.push({ url: fInfo.path, name: fInfo.name })
        } else {
          // Regular files: only file_ids (already on server, no re-send URL)
          data.allFileIds.add(id)
        }
      })
    })

    // Also include API files from subunits that are NOT excluded
    apl02Data?.units.forEach(unit => {
      unit.subunits.forEach(subunit => {
        const subunitId = parseInt(subunit.id)
        if (subunitDataMap.has(subunitId)) {
          const data = subunitDataMap.get(subunitId)
      if (!data) return
          subunit.files.forEach(file => {
            if (!excludedApiFileIds.has(`${unit.id}-${subunit.id}-${file.id}`)) {
              // Regular files from subunit: only file_ids (already on server)
              data.allFileIds.add(file.id)
            }
          })
        }
      })
    })

    // Dedup file_urls by URL (same file can be selected for multiple KUKs)
    const dedupByUrl = (arr: { url: string; name: string }[]) => {
      const seen = new Set<string>()
      return arr.filter(item => {
        if (seen.has(item.url)) return false
        seen.add(item.url)
        return true
      })
    }
    // Convert to answers array format
    // asesi sends kompeten: null, asesor sends kompeten: true/false
    const answers = Array.from(subunitDataMap.entries()).map(([subunitId, data]) => ({
      subunit_id: subunitId,
      kompeten: data.statuses.every(s => s === 'K'),
      file_ids: Array.from(data.allFileIds),
      file_urls: dedupByUrl(data.allFileUrls)
    }))

    // Check if all subunits have been answered
    if (apl02Data?.units) {
      let totalSubunits = 0
      apl02Data.units.forEach(unit => {
        totalSubunits += unit.subunits.length
      })

      if (answers.length === 0) {
        showWarning("Silakan isi penilaian K/BK untuk semua Kriteria Unjuk Kerja")
        return
      }
    }

    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/praasesmen/${finalIdIzin}/apl02`, {
        method: 'POST',
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          metode: metodeAsesmenRef.current || '', // Default to observasi if null (asesi submit before asesor chooses)
          is_dilanjutkan: true,
          answers
        }),
      })

      if (response.ok) {
        // Generate QR jika belum ada dan jadwalId tersedia
        if (jadwalId) {
          // Cek apakah ada subunit yang belum punya barcode asesi
          const hasMissingBarcode = apl02Data?.units.some(unit =>
            unit.subunits.some(subunit => !subunit.barcodes?.asesi?.url)
          )

          if (tahap !== 0 && !isUuidFlow && hasMissingBarcode) {
            try {
              const qrResponse = await fetch(`${API_BASE_URL}/qr/${finalIdIzin}/apl02`, {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id_jadwal: jadwalId
                })
              })

              if (qrResponse.ok) {
                const qrResult = await qrResponse.json()
                if (qrResult.message === "Success" && qrResult.data?.url_image) {
                  // Update barcodes state - untuk display
                  // Karena barcode sama untuk semua subunit, update semua
                  const newBarcodes: Record<string, SubunitBarcodes> = {}
                  apl02Data?.units.forEach(unit => {
                    unit.subunits.forEach(subunit => {
                      newBarcodes[subunit.id] = {
                        asesi: {
                          url: qrResult.data.url_image,
                          tanggal: new Date().toISOString(),
                          nama: user?.name || null
                        },
                        asesor1: subunit.barcodes?.asesor1 || null,
                        asesor2: subunit.barcodes?.asesor2 || null
                      }
                    })
                  })
                  setSubunitBarcodes(newBarcodes)
                }
              }
            } catch (qrError) {
              console.error('Error generating QR:', qrError)
              // Continue even if QR generation fails
            }
          }
        }

        showSuccess('APL 02 berhasil ditandatangani!')
        signing.publishUpdate()
        // Untuk tahap 0 atau UUID flow, langsung navigasi ke halaman berikutnya
        if (tahap === 0 || isUuidFlow) {
          setTimeout(() => navigate(getNextRoute(finalIdIzin)), 500)
        }
      } else {
        const msg = await extractApiError(response, 'Gagal menyimpan data APL 02')
        showError(msg)
      }
    } catch (error) {
      console.error('Error saving APL02:', error)
      showError(extractErrorMessage(error, "Gagal menyimpan data APL 02"))
    } finally {
      setIsSaving(false)
    }
  }

  if (isDataLoading) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {isUuidFlow && <DashboardNavbar userName={namaAsesi || 'Asesi'} />}

      {!isUuidFlow && <AsesmenBreadcrumb currentPage="APL 02" />}

      <Apl02PageLayout
        isUuidFlow={isUuidFlow}
        _idIzin={_idIzin}
        idIzin={idIzin}
        tahap={tahap}
      >
            <div style={{ marginBottom: '20px', marginLeft: '16px' }}>
              <h1 style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', marginBottom: '10px', textTransform: 'uppercase' }}>
                APL-02 ASESMEN MANDIRI<br />{apl02Data?.jabatan_kerja || '-'}
              </h1>
            </div>

        {/* Main content wrapper - prevent layout shift */}
        <div style={{ width: '100%', minWidth: '0' }}>

        {/* Upload File Section */}
        {!isAsesor && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', marginBottom: '20px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}> 
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upload Bukti Dokumen</span>
              <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Upload dokumen pendukung untuk digunakan di kolom bukti</p>
            </div>
            {uploadedFilesInfo.length > 0 && (
              <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}>
                {uploadedFilesInfo.length} File
              </div>
            )}
          </div>

          {/* Drop Zone - asesi upload */}
          {!isAsesor && (() => {
            return (
            <div
              id="apl02-dropzone"
              onClick={() => !isUploading && document.getElementById('file-upload-input')?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const dz = document.getElementById('apl02-dropzone')
                if (dz) { dz.style.borderColor = '#00488f'; dz.style.background = '#e8f0fe' }
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                const dz = document.getElementById('apl02-dropzone')
                if (dz) { dz.style.borderColor = '#0066cc'; dz.style.background = 'linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%)' }
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const dz = document.getElementById('apl02-dropzone')
                if (dz) { dz.style.borderColor = '#0066cc'; dz.style.background = 'linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%)' }
                if (isUploading) return
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  uploadFiles(e.dataTransfer.files)
                }
              }}
              style={{
                border: '2px dashed #0066cc',
                borderRadius: '16px',
                padding: '32px 24px 24px',
                textAlign: 'center',
                cursor: isUploading ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%)',
                transition: 'border-color 0.25s, background 0.25s',
                opacity: isUploading ? 0.7 : 1,
              }}
            >
              <style>{`
                @keyframes apl02-spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes apl02-spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
                @keyframes apl02-float-up { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }
                @keyframes apl02-float-down { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(5px); } }
                @keyframes apl02-upload-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes apl02-upload-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
              `}</style>
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px',
                    border: '3px solid #e2e8f0', borderTop: '3px solid #0066cc',
                    borderRadius: '50%', animation: 'apl02-upload-spin 0.8s linear infinite',
                  }} />
                  <p style={{ fontSize: '14px', color: '#333', margin: 0, fontWeight: '600', animation: 'apl02-upload-pulse 1.5s ease-in-out infinite' }}>Mengupload...</p>
                </div>
              ) : (
                <>
                  <svg width="120" height="110" viewBox="0 0 140 130" fill="none" style={{ display: 'block', margin: '0 auto 12px', pointerEvents: 'none' }}>
                    {/* Folder shadow */}
                    <ellipse cx="70" cy="122" rx="46" ry="6" fill="#c0d4ec" opacity="0.35"/>
                    {/* Folder back */}
                    <rect x="18" y="62" width="104" height="54" rx="8" fill="#d0e1f7"/>
                    {/* Folder tab */}
                    <path d="M18 62 Q18 54 26 54 L55 54 Q60 54 62 58 L66 64 H18 Z" fill="#bcd4f0"/>
                    {/* Folder front */}
                    <rect x="18" y="64" width="104" height="52" rx="8" fill="#c8ddf5"/>
                    {/* Folder stripe */}
                    <rect x="18" y="64" width="104" height="6" rx="4" fill="#dae8fa" opacity="0.7"/>
                    {/* Folder bottom */}
                    <rect x="22" y="110" width="96" height="4" rx="2" fill="#b0cbe8"/>

                    {/* Upload arrow on folder */}
                    <path d="M70 80 L70 98" stroke="#0066cc" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M62 88 L70 78 L78 88" stroke="#0066cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

                    {/* Gear group left - floating */}
                    <g style={{ animation: 'apl02-float-up 3.2s ease-in-out infinite', transformOrigin: '38px 40px' }}>
                      <g style={{ animation: 'apl02-spin-cw 4s linear infinite', transformOrigin: '38px 40px' }}>
                        <circle cx="38" cy="40" r="13" fill="#0066cc"/>
                        <circle cx="38" cy="40" r="7" fill="#f0f7ff"/>
                        <rect x="35.5" y="24" width="5" height="7" rx="2" fill="#0066cc"/>
                        <rect x="35.5" y="49" width="5" height="7" rx="2" fill="#0066cc"/>
                        <rect x="22" y="37.5" width="7" height="5" rx="2" fill="#0066cc"/>
                        <rect x="47" y="37.5" width="7" height="5" rx="2" fill="#0066cc"/>
                        <rect x="23.5" y="26.5" width="5" height="7" rx="2" fill="#0066cc" transform="rotate(45 26 30)"/>
                        <rect x="47.5" y="26.5" width="5" height="7" rx="2" fill="#0066cc" transform="rotate(-45 50 30)"/>
                        <rect x="23.5" y="43.5" width="5" height="7" rx="2" fill="#0066cc" transform="rotate(-45 26 47)"/>
                        <rect x="47.5" y="43.5" width="5" height="7" rx="2" fill="#0066cc" transform="rotate(45 50 47)"/>
                        <circle cx="38" cy="40" r="2.5" fill="#0066cc" opacity="0.4"/>
                      </g>
                    </g>

                    {/* Gear group right - floating */}
                    <g style={{ animation: 'apl02-float-down 2.8s ease-in-out infinite 0.4s', transformOrigin: '102px 30px' }}>
                      <g style={{ animation: 'apl02-spin-ccw 2s linear infinite', transformOrigin: '102px 30px' }}>
                        <circle cx="102" cy="30" r="9" fill="#1a8cff"/>
                        <circle cx="102" cy="30" r="4.5" fill="#f0f7ff"/>
                        <rect x="99.5" y="18.5" width="5" height="5.5" rx="1.5" fill="#1a8cff"/>
                        <rect x="99.5" y="36" width="5" height="5.5" rx="1.5" fill="#1a8cff"/>
                        <rect x="90" y="27.5" width="5.5" height="5" rx="1.5" fill="#1a8cff"/>
                        <rect x="108.5" y="27.5" width="5.5" height="5" rx="1.5" fill="#1a8cff"/>
                        <rect x="92" y="20.5" width="5" height="5.5" rx="1.5" fill="#1a8cff" transform="rotate(45 94.5 23)"/>
                        <rect x="107" y="20.5" width="5" height="5.5" rx="1.5" fill="#1a8cff" transform="rotate(-45 109.5 23)"/>
                        <rect x="92" y="33.5" width="5" height="5.5" rx="1.5" fill="#1a8cff" transform="rotate(-45 94.5 36)"/>
                        <rect x="107" y="33.5" width="5" height="5.5" rx="1.5" fill="#1a8cff" transform="rotate(45 109.5 36)"/>
                        <circle cx="102" cy="30" r="2" fill="#1a8cff" opacity="0.4"/>
                      </g>
                      {/* Tiny gear */}
                      <g style={{ animation: 'apl02-spin-cw 1.6s linear infinite', transformOrigin: '118px 54px' }}>
                        <circle cx="118" cy="54" r="6" fill="#0052a3"/>
                        <circle cx="118" cy="54" r="3" fill="#f0f7ff"/>
                        <rect x="115.5" y="46" width="5" height="4" rx="1.5" fill="#0052a3"/>
                        <rect x="115.5" y="58" width="5" height="4" rx="1.5" fill="#0052a3"/>
                        <rect x="110" y="51.5" width="4" height="5" rx="1.5" fill="#0052a3"/>
                        <rect x="124" y="51.5" width="4" height="5" rx="1.5" fill="#0052a3"/>
                        <rect x="111.5" y="47.5" width="4" height="4" rx="1.5" fill="#0052a3" transform="rotate(45 113.5 49.5)"/>
                        <rect x="120.5" y="47.5" width="4" height="4" rx="1.5" fill="#0052a3" transform="rotate(-45 122.5 49.5)"/>
                        <rect x="111.5" y="56" width="4" height="4" rx="1.5" fill="#0052a3" transform="rotate(-45 113.5 58)"/>
                        <rect x="120.5" y="56" width="4" height="4" rx="1.5" fill="#0052a3" transform="rotate(45 122.5 58)"/>
                        <circle cx="118" cy="54" r="1.5" fill="#0052a3" opacity="0.4"/>
                      </g>
                    </g>

                    {/* Connecting line */}
                    <line x1="51" y1="40" x2="93" y2="30" stroke="#0066cc" strokeWidth="1" strokeDasharray="3 4" opacity="0.15"/>
                    {/* Sparkles */}
                    <circle cx="82" cy="20" r="1.5" fill="#0066cc" opacity="0.3"/>
                    <circle cx="20" cy="58" r="1" fill="#1a8cff" opacity="0.25"/>
                    <circle cx="128" cy="42" r="1" fill="#1a8cff" opacity="0.2"/>
                  </svg>
                  <p style={{ fontSize: '14px', color: '#333', margin: 0, fontWeight: '600' }}>
                    Seret & lepas file di sini
                  </p>
                  <p style={{ fontSize: '12px', color: '#888', margin: '6px 0 0 0' }}>
                    atau <span style={{ color: '#0066cc', textDecoration: 'underline' }}>klik untuk browse</span>
                  </p>
                  <p style={{ fontSize: '11px', color: '#aaa', margin: '6px 0 0 0' }}>PDF, JPG, PNG, DOC, DOCX (Maks. 5MB per file)</p>
                </>
              )}
            </div>
            )
          })()}

          <input
            id="file-upload-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          {/* Uploaded Files List */}
          {uploadedFilesInfo.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                File yang Diupload ({uploadedFilesInfo.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {uploadedFilesInfo.map((file) => (
                  <ServerFileCapsule
                    key={file.id}
                    file={file}
                    onDelete={deleteFile}
                    disabled={isAsesor || isSaving}
                    isAsesor={isAsesor}
                    onView={onViewFile}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        )}
        {/* Notice */}
        <div style={{ background: '#fff9e6', border: '1px solid #e6b800', marginBottom: '20px', padding: '12px' }}>
          <p style={{ fontSize: '12px', color: '#000', margin: 0 }}>
            <strong>CATATAN:</strong> K = Kompeten, BK = Belum Kompeten. Isi kolom bukti dengan dokumen pendukung yang Anda miliki.
          </p>
        </div>

        {/* Header Table, Panduan, dan Unit Kompetensi - memoized */}
        <Apl02Content
          apl02Data={apl02Data}
          kukChecklist={kukChecklist}
          kukBukti={kukBukti}
          uploadedFilesInfo={uploadedFilesInfo}
          excludedApiFileIds={excludedApiFileIds}
          isAsesor={isAsesor}
          isSaving={isSaving}
          jenjang={jenjang}
          onCheckRadio={handleCheckRadio}
          onToggleExclude={handleToggleExclude}
          onRemoveBukti={handleRemoveBukti}
          onSelectBukti={handleSelectBukti}
          onViewFile={onViewFile}
          refreshKey={filePanelRefreshKey}
        />

        {/* Rekomendasi Untuk Asesi - state isolated */}
        <RekomendasiAsesiSection
          initialValue={metodeAsesmenRef.current}
          isAsesor={isAsesor}
          jenjang={jenjang}
          asesorList={asesorList}
          namaAsesi={namaAsesi}
          apl02Data={apl02Data}
          user={user}
          subunitBarcodes={subunitBarcodes}
          onMetodeChange={handleMetodeChange}
        />

        <div style={{ background: '#fff', border: '1px solid #000', borderRadius: '4px', marginBottom: '20px', padding: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <CustomCheckbox
              checked={signing.agreedChecklist}
              onChange={handleToggleAgreement}
            />
            <span style={{ fontSize: '12px', color: '#000', lineHeight: '1.5' }}>
              <strong style={{ textTransform: 'uppercase' }}>Pernyataan:</strong> Saya menyatakan bahwa saya telah memahami dan memahami dokumen APL 02 (Asesmen Mandiri) ini dengan sebenar-benarnya.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {isAsesor && (
            <ActionButton variant="secondary" onClick={handleNavigateBack} disabled={isSaving}>
              Kembali
            </ActionButton>
          )}
          <ActionButton variant="primary" disabled={signing.buttonDisabled} onClick={handleSubmit}>
            {signing.buttonText}
          </ActionButton>
        </div>
        </div> {/* Close main content wrapper */}
      </Apl02PageLayout>

      {!isUuidFlow && (
        <>
      <WebcamModal
        isOpen={showAwalModal}
        onClose={handleAwalModalClose}
        onSubmit={submitAbsenAwal}
        title="Absen Masuk Pra-Asesmen"
        description="Silakan ambil foto wajah Anda untuk absen masuk"
        canClose={false}
      />

      <DocumentPreviewModal
        isOpen={showPreview}
        onClose={handleClosePreview}
        file={selectedPreviewFile}
      />
        </>
      )}

      <FileTypeModal
        isOpen={showFileTypeModal}
        stagingFiles={stagingFiles}
        fileDocTypes={fileDocTypes}
        setFileDocTypes={setFileDocTypes}
        fileCustomTypes={fileCustomTypes}
        setFileCustomTypes={setFileCustomTypes}
        isUploading={isUploading}
        onClose={handleCloseFileModal}
        onUpload={handleUploadFiles}
      />
    </div>
  )
}
