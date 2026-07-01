/**
 * Mapa01.tsx
 * FR. MAPA.01 MERENCANAKAN AKTIVITAS DAN PROSES ASESMEN
 * 1:1 dengan HTML Word
 */

import { Mapa01Section1 } from "./Mapa01Section1"
import { Mapa01Section2 } from "./Mapa01Section2"
import { Mapa01Section3 } from "./Mapa01Section3"
import { Mapa01TandaTangan } from "./Mapa01TandaTangan"

interface Mapa01Props {
  judul?: string
  nomor?: string
  kelompokKerja?: any[]
}

export function Mapa01({
  judul = '',
  nomor = '',
  kelompokKerja = []
}: Mapa01Props) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '700px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#000',
    }}>
      {/* Title */}
      <p style={{ padding: '4pt 6pt', textAlign: 'left', margin: 0 }}>
        FR. MAPA.01 MERENCANAKAN AKTIVITAS DAN PROSES ASESMEN
      </p>
      <p style={{ margin: 0 }}><br /></p>

      {/* Header Table */}
      <table style={{
        borderCollapse: 'collapse',
        marginLeft: '7.99pt'
      }} cellSpacing="0">
        <tbody>
          <tr style={{ height: '23pt' }}>
            <td style={{
              width: '128pt',
              borderTop: '2pt solid #000',
              borderLeft: '2pt solid #000',
              borderBottom: '2pt solid #000',
              borderRight: '1pt solid #000'
            }} rowSpan={2}>
              <p style={{ padding: '4pt 5pt 4pt 27pt', margin: 0, lineHeight: '109%', textAlign: 'left' }}>
                Skema Sertifikasi Okupasi Nasional
              </p>
            </td>
            <td style={{
              width: '62pt',
              borderTop: '2pt solid #000',
              borderLeft: '1pt solid #000',
              borderBottom: '1pt solid #000',
              borderRight: '1pt solid #000'
            }}>
              <p style={{ padding: '6pt', margin: 0, textAlign: 'left' }}>Judul</p>
            </td>
            <td style={{
              width: '22pt',
              borderTop: '2pt solid #000',
              borderLeft: '1pt solid #000',
              borderBottom: '1pt solid #000',
              borderRight: '1pt solid #000'
            }}>
              <p style={{ padding: '6pt', margin: 0, textAlign: 'left' }}>: </p>
            </td>
            <td style={{
              width: '288pt',
              borderTop: '2pt solid #000',
              borderLeft: '1pt solid #000',
              borderBottom: '1pt solid #000',
              borderRight: '2pt solid #000'
            }}>
              <p style={{ padding: '6pt', margin: 0, textAlign: 'left' }}>{judul}</p>
            </td>
          </tr>
          <tr style={{ height: '24pt' }}>
            <td style={{
              width: '62pt',
              borderTop: '1pt solid #000',
              borderLeft: '1pt solid #000',
              borderBottom: '2pt solid #000',
              borderRight: '1pt solid #000'
            }}>
              <p style={{ padding: '6pt', margin: 0, textAlign: 'left' }}>Nomor</p>
            </td>
            <td style={{
              width: '22pt',
              borderTop: '1pt solid #000',
              borderLeft: '1pt solid #000',
              borderBottom: '2pt solid #000',
              borderRight: '1pt solid #000'
            }}>
              <p style={{ padding: '6pt', margin: 0, textAlign: 'left' }}>: </p>
            </td>
            <td style={{
              width: '288pt',
              borderTop: '1pt solid #000',
              borderLeft: '1pt solid #000',
              borderBottom: '2pt solid #000',
              borderRight: '2pt solid #000'
            }}>
              <p style={{ padding: '6pt', margin: 0, textAlign: 'left' }}>{nomor}</p>
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ padding: '11pt 0 0 0', margin: 0 }}><br /></p>

      {/* Section 1 */}
      <Mapa01Section1 />

      {/* Section 2 */}
      <Mapa01Section2 kelompokKerja={kelompokKerja} />

      {/* Section 3 */}
      <Mapa01Section3 />

      {/* Tanda Tangan */}
      <Mapa01TandaTangan />
    </div>
  )
}
