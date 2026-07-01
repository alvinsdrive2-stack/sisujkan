/**
 * Mapa01TandaTangan.tsx
 * Tanda Tangan & Konfirmasi section - 100% width with thin borders
 */

import { useState, useMemo, useEffect } from "react"
import { CustomCheckbox } from "../ui/Checkbox"

// ============== TYPES ==============
interface Referensi {
  id: number
  nama: string
  value: boolean
}

interface Subkategori {
  id: number | null
  nama: string
  urut: number | null
  referensis: Referensi[]
}

interface Kategori {
  id: number | null
  kategori: string | null
  nama: string
  urut: number | null
  id_kelompok: number | null
  subkategoris: Subkategori[]
}

interface KelompokForm {
  id: number
  nama: string | null
  urut: number
  kategoris: Kategori[]
}

interface ReferensiFormItem {
  kelompok: KelompokForm
}

interface Mapa01TandaTanganProps {
  namaPenyusun?: string | null
  namaValidator?: string | null
  tanggalPenyusun?: string | null
  tanggalValidator?: string | null
  barcodePenyusun?: string | null
  barcodeValidator?: string | null
  noregPenyusun?: string | null
  noregValidator?: string | null
  namaManajer?: string | null
  tanggalManajer?: string | null
  barcodeManajer?: string | null
  referensiForm?: ReferensiFormItem[]
  isAsesor?: boolean
}

// ============== CONSTANTS ==============
const COLORS = {
  BLACK: '#000',
  WHITE: '#FFF',
  RED: '#C00000',
} as const;

const BORDER = {
  thin: '1px solid #000',
} as const;

// ============== HELPER FUNCTIONS ==============
function createCellStyle(
  borderTop: string,
  borderLeft: string,
  borderBottom: string,
  borderRight: string
) {
  return {
    borderTop,
    borderLeft,
    borderBottom,
    borderRight,
  };
}

const cellStyles = {
  header: createCellStyle(BORDER.thin, BORDER.thin, BORDER.thin, BORDER.thin),
  content: createCellStyle(BORDER.thin, BORDER.thin, BORDER.thin, BORDER.thin),
} as const;

// ============== COMPONENT ==============
export function Mapa01TandaTangan({
  namaPenyusun,
  namaValidator,
  tanggalPenyusun,
  tanggalValidator,
  barcodePenyusun,
  barcodeValidator,
  noregPenyusun,
  noregValidator,
  namaManajer,
  tanggalManajer,
  barcodeManajer,
  referensiForm,
  isAsesor = false
}: Mapa01TandaTanganProps) {
  // Build checkbox states from referensiForm data
  const initialCheckboxStates = useMemo(() => {
    const states: Record<string, boolean> = {}
    if (referensiForm) {
      referensiForm.forEach((item) => {
        const kelompok = item.kelompok
        kelompok.kategoris?.forEach((kategori) => {
          if (kategori.nama === "Orang yang relevan untuk dikonfirmasi") {
            kategori.subkategoris?.forEach((subkategori) => {
              subkategori.referensis?.forEach((ref) => {
                states[`ref_${ref.id}`] = ref.value
              })
            })
          }
        })
      })
    }
    return states
  }, [referensiForm])

  const [checkboxStates, setCheckboxStates] = useState<Record<string, boolean>>({})

  // Sync checkbox states when referensiForm loads
  useEffect(() => {
    if (Object.keys(initialCheckboxStates).length > 0) {
      setCheckboxStates(initialCheckboxStates)
    }
  }, [initialCheckboxStates])

  const toggleCheckbox = (refId: number) => {
    setCheckboxStates(prev => ({ ...prev, [`ref_${refId}`]: !prev[`ref_${refId}`] }))
  }

  // Get "Orang yang relevan untuk dikonfirmasi" references dynamically
  const getKonfirmasiReferences = () => {
    if (!referensiForm) return []

    const references: Array<{ id: number; nama: string }> = []

    referensiForm.forEach((item) => {
      const kelompok = item.kelompok
      kelompok.kategoris?.forEach((kategori) => {
        if (kategori.nama === "Orang yang relevan untuk dikonfirmasi") {
          kategori.subkategoris?.forEach((subkategori) => {
            subkategori.referensis?.forEach((ref) => {
              references.push({ id: ref.id, nama: ref.nama })
            })
          })
        }
      })
    })

    return references
  }

  const konfirmasiReferences = getKonfirmasiReferences()

  const headerCellStyle = {
    ...cellStyles.header,
    backgroundColor: COLORS.RED,
  };

  const headerTextStyle = {
    color: COLORS.WHITE,
    fontWeight: 'bold' as const,
    fontSize: '12px',
    padding: '6px 8px',
  };

  const contentCellStyle = {
    ...cellStyles.content,
    background: '#fff' as const,
  };

  return (
    <>
      {/* Title */}
      <h1 style={{
        paddingLeft: '13px',
        margin: 0,
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'black',
        fontFamily: 'Arial, sans-serif'
      }}>
        Konfirmasi dengan orang yang relevan:
      </h1>
      <p style={{ margin: 0 }}><br /></p>

      {/* Konfirmasi Table - Dynamic from API */}
      <table style={{ width: '100%', borderCollapse: 'collapse' as const }} cellSpacing="0">
        <tbody>
          <tr style={{ height: '23pt' }}>
            <td style={headerCellStyle}>
              <span style={{ ...headerTextStyle, textAlign: 'left' }}>
                Orang yang relevan
              </span>
            </td>
            <td style={headerCellStyle}>
              <span style={{ ...headerTextStyle, textAlign: 'center' }}>
                Nama
              </span>
            </td>
            <td style={headerCellStyle}>
              <span style={{ ...headerTextStyle, textAlign: 'left' }}>
                Tandatangan
              </span>
            </td>
          </tr>

          {/* Dynamic rows from API */}
          {konfirmasiReferences.map((ref) => {
            const isManajer = ref.nama === "Manajer sertifikasi LSP Gatensi Karya Konstruksi"
            return (
            <tr key={ref.id} style={{ height: ref.id === 104 ? '46pt' : '54pt' }}>
              <td style={{
                ...contentCellStyle,
                padding: ref.id === 104 ? '7px 20px' : (ref.id === 102 || ref.id === 103 ? '6px 20px' : '11px 20px'),
                lineHeight: ref.id === 102 || ref.id === 103 ? '12px' : undefined
              }}>
                <div
                  onClick={() => isAsesor && toggleCheckbox(ref.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: isAsesor ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                >
                  <CustomCheckbox
                    checked={checkboxStates[`ref_${ref.id}`] ?? false}
                    onChange={() => {}}
                    style={{ pointerEvents: 'none', opacity: isAsesor ? 1 : 0.5 }}
                  />
                  <span style={{ fontSize: '12px', color: COLORS.BLACK }}>
                    {ref.nama}
                  </span>
                </div>
              </td>
              <td style={{ ...contentCellStyle, padding: '12px 8px', fontSize: '12px' }}>
                {isManajer && namaManajer ? namaManajer : ''}
              </td>
              <td style={{ ...contentCellStyle, padding: '8px', textAlign: 'center' }}>
                {isManajer && barcodeManajer ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <img src={barcodeManajer} alt="QR Manajer" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    {tanggalManajer && <span style={{ fontSize: '10px' }}>{new Date(tanggalManajer).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                  </div>
                ) : (isManajer && tanggalManajer ? new Date(tanggalManajer).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '')}
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>

      <p style={{ paddingTop: '3px', margin: 0 }}><br /></p>

      {/* Tanda Tangan Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' as const }} cellSpacing="0">
        <tbody>
          <tr style={{ height: '28pt' }}>
            <td style={headerCellStyle}>
              <span style={headerTextStyle}>
                Status
              </span>
            </td>
            <td style={headerCellStyle}>
              <span style={{ ...headerTextStyle, textAlign: 'center' }}>
                No
              </span>
            </td>
            <td style={headerCellStyle}>
              <span style={{ ...headerTextStyle, textAlign: 'center' }}>
                Nama
              </span>
            </td>
            <td style={headerCellStyle}>
              <span style={{ ...headerTextStyle, textAlign: 'left' }}>
                Nomor MET
              </span>
            </td>
            <td style={headerCellStyle}>
              <span style={headerTextStyle}>
                Tanda Tangan dan Tanggal
              </span>
            </td>
          </tr>

          {/* Penyusun */}
          <tr style={{ height: '91pt' }}>
            <td style={{ ...contentCellStyle }} rowSpan={2}>
              <div style={{ padding: '15px 0 0 0' }}></div>
              <span style={{ fontSize: '12px', color: 'black', paddingLeft: '15px' }}>
                Penyusun
              </span>
            </td>
            <td style={{ ...contentCellStyle, padding: '6px 8px' }}>
              <span style={{ fontSize: '12px', color: 'black', textAlign: 'center' }}>1</span>
            </td>
            <td style={{ ...contentCellStyle, padding: '7px 8px', fontSize: '12px' }}>{namaPenyusun || ''}</td>
            <td style={{ ...contentCellStyle, padding: '13px 8px', fontSize: '12px' }}>{noregPenyusun || '-'}</td>
            <td style={{ ...contentCellStyle, padding: '8px', textAlign: 'center' }}>
              {barcodePenyusun ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <img src={barcodePenyusun} alt="QR Penyusun" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                  {tanggalPenyusun && <span style={{ fontSize: '10px' }}>{new Date(tanggalPenyusun).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                </div>
              ) : ''}
            </td>
          </tr>

          <tr style={{ height: '23pt' }}>
            <td style={{ ...contentCellStyle, padding: '1px 8px' }}></td>
            <td style={{ ...contentCellStyle, padding: '1px 8px' }}></td>
            <td style={{ ...contentCellStyle, padding: '1px 8px' }}></td>
            <td style={{ ...contentCellStyle, padding: '1px 8px' }}></td>
          </tr>

          {/* Validator */}
          <tr style={{ height: '68pt' }}>
            <td style={{ ...contentCellStyle }} rowSpan={2}>
              <div style={{ padding: '18px 0 0 0' }}></div>
              <span style={{ fontSize: '12px', color: 'black', paddingLeft: '18px' }}>
                Validator
              </span>
            </td>
            <td style={{ ...contentCellStyle, padding: '6px 8px' }}>
              <span style={{ fontSize: '12px', color: 'black', textAlign: 'center' }}>1</span>
            </td>
            <td style={{ ...contentCellStyle, padding: '7px 8px', fontSize: '12px' }}>{namaValidator || ''}</td>
            <td style={{ ...contentCellStyle, padding: '13px 8px', fontSize: '12px' }}>{noregValidator || '-'}</td>
            <td style={{ ...contentCellStyle, padding: '8px', textAlign: 'center' }}>
              {barcodeValidator ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <img src={barcodeValidator} alt="QR Validator" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                  {tanggalValidator && <span style={{ fontSize: '10px' }}>{new Date(tanggalValidator).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                </div>
              ) : ''}
            </td>
          </tr>

          <tr style={{ height: '23pt' }}>
            <td style={{ ...contentCellStyle, padding: '1px 8px' }}></td>
            <td style={{ ...contentCellStyle, padding: '1px 8px' }}></td>
            <td style={{ ...contentCellStyle, padding: '1px 8px' }}></td>
            <td style={{ ...contentCellStyle, padding: '1px 8px' }}></td>
          </tr>
        </tbody>
      </table>
      <br></br>
    </>
  )
}
