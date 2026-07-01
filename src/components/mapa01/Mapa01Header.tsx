/**
 * Mapa01Header.tsx
 * Header section - FR. MAPA.01 MERENCANAKAN AKTIVITAS DAN PROSES ASESMEN
 */

interface Mapa01HeaderProps {
  judul?: string
  nomor?: string
  skkni?: string
}

export function Mapa01Header({
  judul = '',
  nomor = '',
  skkni = ''
}: Mapa01HeaderProps) {
  return (
    <>
      {/* Title */}
      <div style={{ marginBottom: '16px', marginTop: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', marginBottom: '8px' }}>
          FR. MAPA.01 MERENCANAKAN AKTIVITAS DAN PROSES ASESMEN
        </h2>
      </div>

      {/* Skema Sertifikasi Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px',
        marginBottom: '16px'
      }}>
        <tbody>
          <tr>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              background: '#fff',
              
            }}>
              Skema Sertifikasi Okupasi Nasional
            </td>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              textAlign: 'left',
              background: '#fff'
            }}>
              Judul
            </td>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              textAlign: 'left',
              background: '#fff'
            }}>
              :
            </td>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              background: '#fff'
            }}>
              {judul}
            </td>
          </tr>
          <tr>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              background: '#fff'
            }}>
              {/* Empty cell */}
            </td>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              textAlign: 'left',
              background: '#fff'
            }}>
              Nomor
            </td>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              textAlign: 'left',
              background: '#fff'
            }}>
              :
            </td>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              background: '#fff'
            }}>
              {nomor}
            </td>
          </tr>
          <tr>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              background: '#fff'
            }}>
              {/* Empty cell */}
            </td>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              textAlign: 'left',
              background: '#fff'
            }}>
              SKKNI
            </td>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              textAlign: 'left',
              background: '#fff'
            }}>
              :
            </td>
            <td style={{
              border: '1px solid #000',
              padding: '6px 8px',
              verticalAlign: 'middle',
              background: '#fff'
            }}>
              {skkni}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}
