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
  console.log('[docx-extractor] Starting extract for', file.name, 'type:', type)

  const arrayBuf = await file.arrayBuffer()
  console.log('[docx-extractor] File size:', arrayBuf.byteLength)

  const zip = await JSZip.loadAsync(arrayBuf)
  const docFile = zip.file('word/document.xml')
  if (!docFile) {
    const files = Object.keys(zip.files).filter(f => f.endsWith('.xml'))
    console.error('[docx-extractor] word/document.xml not found. Available XML files:', files.slice(0, 10))
    throw new Error('Invalid DOCX: word/document.xml not found')
  }

  const rawXml = await docFile.async('string')
  console.log('[docx-extractor] Raw XML length:', rawXml.length)

  // Strip namespace prefixes (w:, r:, etc.) so CSS selectors work cross-browser
  const xmlStr = rawXml.replace(/<(\/?)\w+:/g, '<$1')
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlStr, 'application/xml')

  const parseErr = xmlDoc.querySelector('parsererror')
  if (parseErr) {
    console.error('[docx-extractor] XML parse error:', parseErr.textContent)
    throw new Error('Failed to parse DOCX XML')
  }

  const tableCount = xmlDoc.querySelectorAll('tbl').length
  console.log('[docx-extractor] Tables found:', tableCount)

  if (tableCount > 0) {
    const firstRowCells = xmlDoc.querySelectorAll('tbl:first-of-type tr:first-of-type tc')
    console.log('[docx-extractor] First table headers:', Array.from(firstRowCells).map(getCellText))
  }

  let result: SoalRow[]
  switch (type) {
    case 'ia04b':
      result = extractIA04B(xmlDoc)
      break
    case 'ia05':
      result = extractIA05(xmlDoc)
      break
    case 'ia06':
      result = extractIA06(xmlDoc)
      break
    default:
      throw new Error(`Unknown document type: ${type}`)
  }

  console.log('[docx-extractor] Extracted:', result.length, 'soals')
  return result
}
