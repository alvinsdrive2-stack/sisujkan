import JSZip from 'jszip'

type SoalRow = Record<string, string | number>

function getCellText(cell: Element): string {
  const texts = cell.querySelectorAll('t')
  let s = ''
  texts.forEach(t => { s += t.textContent })
  return s.trim()
}

function getRowCells(row: Element): string[] {
  const cells = row.querySelectorAll('tc')
  return Array.from(cells).map(getCellText)
}

function extractIA04B(doc: Document): SoalRow[] {
  const tables = doc.querySelectorAll('tbl')
  const soals: SoalRow[] = []

  for (const t of Array.from(tables)) {
    const rows = t.querySelectorAll('tr')
    if (rows.length < 5) continue

    const cols = rows[0].querySelectorAll('tc').length
    if (cols < 4) continue

    const c0 = getCellText(rows[0] as Element)
    if (!c0.includes('Aspek') && !c0.includes('Lingkup')) continue

    for (let i = 2; i < rows.length; i += 2) {
      const cells = getRowCells(rows[i] as Element)
      if (!cells[0] || !cells[0][0]?.match(/\d/)) continue

      const number = cells[0].replace(/\.$/, '')
      const lingkup = cells[1] || ''
      let soalText = cells[2] || ''
      soalText = soalText.replace(/^Soal:\s*/i, '')
      let kodeUnit = cells[3] || ''
      kodeUnit = kodeUnit.replace(/^Kode Unit:\s*/i, '')

      soals.push({
        no: parseInt(number, 10),
        soal: soalText,
        lingkup,
        kode_unit: kodeUnit,
      })
    }
  }
  return soals
}

function extractIA05(doc: Document): SoalRow[] {
  const tables = doc.querySelectorAll('tbl')
  const soals: SoalRow[] = []

  for (const t of Array.from(tables)) {
    const rows = t.querySelectorAll('tr')
    if (rows.length < 10) continue
    const cols = rows[0].querySelectorAll('tc').length
    if (cols < 3) continue

    const c0 = getCellText(rows[0] as Element)
    if (!c0.includes('KUK') && !c0.includes('SOAL')) continue

    let r = 1
    while (r < rows.length) {
      const cells = getRowCells(rows[r] as Element)
      const kuk = cells[0] || ''
      const number = cells[1] || ''

      if (!number.match(/^\d+$/)) { r++; continue }

      const soalText = (cells[3] || cells[2] || '').trim()

      const options: Record<string, string> = {}
      for (let j = 1; j <= 4; j++) {
        if (r + j < rows.length) {
          const oc = getRowCells(rows[r + j] as Element)
          const optLetter = (oc[2] || '').replace(/\.$/, '').trim()
          const optValue = (oc[3] || '').trim()
          if (optLetter && /^[abcd]$/i.test(optLetter)) {
            options[optLetter.toLowerCase()] = optValue
          }
        }
      }

      soals.push({
        no: parseInt(number, 10),
        soal: soalText,
        kode_kuk: kuk,
        jawab_a: options['a'] || '',
        jawab_b: options['b'] || '',
        jawab_c: options['c'] || '',
        jawab_d: options['d'] || '',
      })

      r += 5
    }
  }
  return soals
}

function extractIA06(doc: Document): SoalRow[] {
  const tables = doc.querySelectorAll('tbl')
  const soals: SoalRow[] = []

  for (const t of Array.from(tables)) {
    const rows = t.querySelectorAll('tr')
    if (rows.length < 5) continue
    const cols = rows[0].querySelectorAll('tc').length
    if (cols < 2) continue

    const firstRowCells = getRowCells(rows[0] as Element)
    const c0 = firstRowCells[0] || ''
    const col1 = firstRowCells[1] || ''

    if (!c0.includes('KUK') || (!c0.includes('ESAI') && !col1.includes('ESAI'))) continue

    for (let i = 1; i < rows.length; i++) {
      const cells = getRowCells(rows[i] as Element)
      const kuk = cells[0] || ''
      const number = cells[1] || ''
      const soalText = cells[2] || ''

      if (!number.match(/^\d+$/)) continue

      soals.push({
        no: parseInt(number, 10),
        soal: soalText,
        kode_kuk: kuk,
      })
    }
  }
  return soals
}

export async function extractFromDocx(
  file: File,
  type: string
): Promise<SoalRow[]> {
  const arrayBuf = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuf)

  const docFile = zip.file('word/document.xml')
  if (!docFile) throw new Error('Invalid DOCX: word/document.xml not found')

  // Strip namespace prefixes (w:, r:, etc.) so CSS selectors work cross-browser
  const xmlStr = (await docFile.async('string')).replace(/<(\/?)\w+:/g, '<$1')
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlStr, 'application/xml')

  switch (type) {
    case 'ia04b':
      return extractIA04B(xmlDoc)
    case 'ia05':
      return extractIA05(xmlDoc)
    case 'ia06':
      return extractIA06(xmlDoc)
    default:
      throw new Error(`Unknown document type: ${type}`)
  }
}
