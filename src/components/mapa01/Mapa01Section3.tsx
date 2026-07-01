import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { CustomRadio } from "@/components/ui/Radio"

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

interface Unit {
  id_unit: number
  nama_unit: string
  kode_unit: string
}

interface KelompokKerja {
  id: number
  nama: string
  urut: string
  units: Unit[]
}

interface Mapa01Section3Props {
  referensiForm?: ReferensiFormItem[]
  kelompokKerja?: KelompokKerja[]
  isAsesor?: boolean
  disabled?: boolean
}

interface Section3Item {
  id: number
  label: string
  prefixLabel: string
  value: boolean
  alasan: string
}

const BORDER_THIN = '1px solid #000'

const textareaBaseStyle = (isDisabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '10px 12px',
  fontSize: '12px',
  lineHeight: '1.5',
  border: BORDER_THIN,
  borderRadius: '4px',
  outline: 'none',
  background: isDisabled ? '#f5f5f5' : '#fff',
  resize: 'none',
  overflow: 'hidden',
  fontFamily: 'inherit',
  cursor: isDisabled ? 'not-allowed' : 'text',
  opacity: isDisabled ? 0.6 : 1,
})

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

export function Mapa01Section3({ referensiForm, kelompokKerja, isAsesor = false, disabled = false }: Mapa01Section3Props) {
  const isFormDisabled = disabled || !isAsesor

  const initialItems = useMemo(() => {
    const items: Section3Item[] = []
    const labelMapping: Record<string, { prefix: string; label: string }> = {
      "Karakteristik kandidat: ": { prefix: "3.1. a.", label: "Karakteristik kandidat:" },
      "Kebutuhan kontekstualisasi terkait tempat kerja:": { prefix: "3.1. b.", label: "Kebutuhan kontekstualisasi terkait tempat kerja:" },
      "Saran yang diberikan oleh paket pelatihan atau pengembang pelatihan": { prefix: "3.2.", label: "Saran yang diberikan oleh paket pelatihan atau pengembang pelatihan" },
      "Penyesuaian perangkat asesmen terkait kebutuhan kontekstualisasi": { prefix: "3.3.", label: "Penyesuaian perangkat asesmen terkait kebutuhan kontekstualisasi" },
      "Peluang untuk kegiatan asesmen terintegrasi dan mencatat setiap perubahan yang diperlukan untuk alat asesmen": { prefix: "3.4.", label: "Peluang untuk kegiatan asesmen terintegrasi dan mencatat setiap perubahan yang diperlukan untuk alat asesmen" }
    }
    if (referensiForm) {
      const kelompok3 = referensiForm.find(item => item.kelompok.id === 3)
      if (kelompok3) {
        kelompok3.kelompok.kategoris?.forEach((kategori) => {
          kategori.subkategoris?.forEach((subkategori) => {
            subkategori.referensis?.forEach((ref) => {
              const mapping = labelMapping[ref.nama]
              if (mapping) {
                items.push({ id: ref.id, label: mapping.label, prefixLabel: mapping.prefix, value: ref.value, alasan: '' })
              }
            })
          })
        })
      }
    }
    return items
  }, [referensiForm])

  const [items, setItems] = useState<Section3Item[]>(initialItems)
  const textareaRefs = useRef<Record<number, HTMLTextAreaElement>>({})

  const kelompokDefaultText = useMemo(() => {
    if (!kelompokKerja || kelompokKerja.length === 0) return ''
    const lines: string[] = ['Kelompok Pekerjaan:']
    kelompokKerja.forEach((kelompok, kIdx) => {
      lines.push(`Kelompok ${kIdx + 1}:`)
      kelompok.units.forEach(u => lines.push(`- ${u.kode_unit}`))
    })
    return lines.join('\n')
  }, [kelompokKerja])

  useEffect(() => {
    if (initialItems.length > 0) setItems(initialItems)
  }, [initialItems])

  // Auto-resize all textareas
  const resizeAll = useCallback(() => {
    Object.values(textareaRefs.current).forEach(el => { if (el) autoResize(el) })
  }, [])

  useEffect(() => {
    resizeAll()
  }, [items, kelompokDefaultText, resizeAll])

  const handleRadioChange = (id: number, value: boolean) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, value } : item))
  }

  const handleAlasanChange = (id: number, alasan: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, alasan } : item))
  }

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const }} cellSpacing="0">
        <tbody>
          <tr style={{ height: '26pt' }}>
            <td style={{ backgroundColor: '#C00000', border: BORDER_THIN }} colSpan={2}>
              <p style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px', padding: '6px 8px', margin: 0, textAlign: 'left' }}>
                3. Modifikasi dan Kontekstualisasi:
              </p>
            </td>
          </tr>

          {items.map((item, index) => (
            <tr key={item.id}>
              <td style={{ border: BORDER_THIN, background: '#fff', verticalAlign: 'top' }}>
                <p style={{ padding: '6px 8px', margin: 0, textAlign: 'left', paddingLeft: index < 2 ? (index === 0 ? '6px' : '28px') : '23px' }}>
                  {item.prefixLabel} {item.label}
                </p>
              </td>
              <td style={{ border: BORDER_THIN, background: '#fff', verticalAlign: 'top', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}>
                    <CustomRadio name={`section3-${item.id}`} value="ya" checked={item.value === true} onChange={() => !isFormDisabled && handleRadioChange(item.id, true)} disabled={isFormDisabled} />
                    <span style={{ fontSize: '12px' }}>Ada</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}>
                    <CustomRadio name={`section3-${item.id}`} value="tidak" checked={item.value === false} onChange={() => !isFormDisabled && handleRadioChange(item.id, false)} disabled={isFormDisabled} />
                    <span style={{ fontSize: '12px' }}>Tidak ada</span>
                  </label>
                </div>

                {item.value && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ fontSize: '11px', margin: '0 0 6px 0', fontWeight: '500' }}>Jika ada, tuliskan:</p>
                    {index === items.length - 1 && kelompokDefaultText ? (
                      <textarea
                        ref={(el) => { if (el) { textareaRefs.current[item.id] = el; autoResize(el) } }}
                        value={kelompokDefaultText + '\n\n' + item.alasan}
                        onChange={(e) => {
                          autoResize(e.target)
                          const val = e.target.value
                          if (val.startsWith(kelompokDefaultText)) {
                            handleAlasanChange(item.id, val.slice(kelompokDefaultText.length).replace(/^\n\n/, ''))
                          }
                        }}
                        placeholder="Alasan/keterangan..."
                        disabled={isFormDisabled}
                        style={{ ...textareaBaseStyle(isFormDisabled), minHeight: '60px' }}
                      />
                    ) : (
                      <textarea
                        ref={(el) => { if (el) { textareaRefs.current[item.id] = el; autoResize(el) } }}
                        value={item.alasan}
                        onChange={(e) => { autoResize(e.target); handleAlasanChange(item.id, e.target.value) }}
                        placeholder="Alasan/keterangan..."
                        disabled={isFormDisabled}
                        style={{ ...textareaBaseStyle(isFormDisabled), minHeight: '40px' }}
                      />
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ padding: '0 0 0 14px', margin: 0, fontSize: '12px', textAlign: 'left' }}>
        *Pilih salah satu opsi
      </p>
      <p style={{ padding: '5px 0 0 0', margin: 0 }}><br /></p>
    </>
  )
}
