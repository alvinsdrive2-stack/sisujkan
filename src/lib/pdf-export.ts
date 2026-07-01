import jsPDF from 'jspdf'

// A4 dimensions in mm
const MARGIN = 15

// Font sizes
const FONT_SIZE_TITLE = 16
const FONT_SIZE_SUBTITLE = 14
const FONT_SIZE_BODY = 11
const FONT_SIZE_SMALL = 10

export interface PdfOptions {
  filename?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'letter' | 'legal'
  margin?: number
  compress?: boolean
}

export interface PdfTableOptions {
  headers: string[]
  rows: string[][]
  widths?: number[]
  styles?: {
    fontSize?: number
    cellPadding?: number
    headerBackground?: string
    headerTextColor?: string
  }
}

const DEFAULT_OPTIONS: PdfOptions = {
  filename: 'document.pdf',
  orientation: 'portrait',
  format: 'a4',
  margin: MARGIN,
  compress: true
}

export class PdfGenerator {
  private doc: jsPDF
  private options: PdfOptions
  private currentY: number
  private pageWidth: number
  private pageHeight: number
  private contentWidth: number

  constructor(options: PdfOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.doc = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.format,
      compress: this.options.compress
    })

    const pageSize = this.doc.internal.pageSize
    this.pageWidth = pageSize.getWidth()
    this.pageHeight = pageSize.getHeight()
    this.contentWidth = this.pageWidth - (this.options.margin || MARGIN) * 2
    this.currentY = this.options.margin || MARGIN
  }

  /**
   * Check if we need a new page and add it
   */
  private ensureSpace(requiredHeight: number): void {
    if (this.currentY + requiredHeight > this.pageHeight - (this.options.margin || MARGIN)) {
      this.doc.addPage()
      this.currentY = this.options.margin || MARGIN
    }
  }

  /**
   * Add title to PDF
   */
  addTitle(title: string, fontSize: number = FONT_SIZE_TITLE): void {
    this.ensureSpace(fontSize + 5)
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.pageWidth / 2, this.currentY, { align: 'center' })
    this.currentY += fontSize + 5
  }

  /**
   * Add subtitle/heading to PDF
   */
  addHeading(text: string, fontSize: number = FONT_SIZE_SUBTITLE): void {
    this.ensureSpace(fontSize + 4)
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text, this.options.margin || MARGIN, this.currentY)
    this.currentY += fontSize + 4
  }

  /**
   * Add paragraph text to PDF
   */
  addParagraph(text: string, fontSize: number = FONT_SIZE_BODY): void {
    const lines = this.doc.splitTextToSize(text, this.contentWidth)
    const lineHeight = fontSize * 0.5
    const requiredHeight = lines.length * lineHeight + 5

    this.ensureSpace(requiredHeight)

    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'normal')

    for (const line of lines) {
      this.doc.text(line, this.options.margin || MARGIN, this.currentY)
      this.currentY += lineHeight
    }

    this.currentY += 3
  }

  /**
   * Add table to PDF
   */
  addTable(options: PdfTableOptions): void {
    const { headers, rows, widths, styles = {} } = options
    const cellPadding = styles.cellPadding || 3
    const rowHeight = (styles.fontSize || FONT_SIZE_SMALL) + cellPadding * 2
    const headerHeight = rowHeight + 2

    // Skip if no columns
    if (headers.length === 0) {
      return
    }

    // Calculate column widths
    const tableWidth = this.contentWidth
    const colWidths = widths || headers.map(() => tableWidth / headers.length)

    // Check if header fits
    this.ensureSpace(headerHeight + rows.length * rowHeight + 5)

    this.doc.setFontSize(styles.fontSize || FONT_SIZE_SMALL)

    // Draw header
    if (styles.headerBackground) {
      this.doc.setFillColor(styles.headerBackground)
    }
    if (styles.headerTextColor) {
      this.doc.setTextColor(styles.headerTextColor)
    }

    let x = this.options.margin || MARGIN
    const startX = x

    for (let i = 0; i < headers.length; i++) {
      this.doc.rect(x, this.currentY, colWidths[i], headerHeight, 'F')
      this.doc.setTextColor(styles.headerTextColor || 0)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(headers[i], x + cellPadding, this.currentY + cellPadding + 2)
      x += colWidths[i]
    }

    this.currentY += headerHeight

    // Draw rows
    this.doc.setTextColor(0)
    this.doc.setFont('helvetica', 'normal')

    for (const row of rows) {
      this.ensureSpace(rowHeight)

      this.doc.setDrawColor(200)
      x = startX

      for (let i = 0; i < row.length; i++) {
        this.doc.rect(x, this.currentY, colWidths[i], rowHeight)
        this.doc.text(row[i] || '', x + cellPadding, this.currentY + cellPadding + 2)
        x += colWidths[i]
      }

      this.currentY += rowHeight
    }

    this.currentY += 5
  }

  /**
   * Add checkbox item to PDF
   */
  addCheckbox(label: string, checked: boolean = false): void {
    const fontSize = FONT_SIZE_BODY
    const checkboxSize = 4
    const lineHeight = fontSize * 0.5

    this.ensureSpace(lineHeight + 2)

    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'normal')

    const y = this.currentY
    const x = this.options.margin || MARGIN

    // Draw checkbox
    this.doc.rect(x, y, checkboxSize, checkboxSize)

    if (checked) {
      this.doc.line(x, y, x + checkboxSize, y + checkboxSize)
      this.doc.line(x + checkboxSize, y, x, y + checkboxSize)
    }

    // Draw label
    this.doc.text(label, x + checkboxSize + 3, y + 3)

    this.currentY += lineHeight + 3
  }

  /**
   * Add form field to PDF
   */
  addFormField(label: string, value: string = '', width?: number): void {
    const fontSize = FONT_SIZE_BODY
    const lineHeight = fontSize * 0.5

    this.ensureSpace(lineHeight * 2 + 2)

    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(`${label}:`, this.options.margin || MARGIN, this.currentY)
    this.currentY += lineHeight

    // Draw field box
    const fieldWidth = width || this.contentWidth - 20
    const fieldHeight = 8
    const x = this.options.margin || MARGIN

    this.doc.rect(x, this.currentY, fieldWidth, fieldHeight)

    if (value) {
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(value, x + 2, this.currentY + 5)
    }

    this.currentY += fieldHeight + 3
  }

  /**
   * Add horizontal line
   */
  addLine(): void {
    this.ensureSpace(3)
    const y = this.currentY
    this.doc.line(
      this.options.margin || MARGIN,
      y,
      this.pageWidth - (this.options.margin || MARGIN),
      y
    )
    this.currentY += 5
  }

  /**
   * Add empty space
   */
  addSpace(mm: number = 5): void {
    this.currentY += mm
  }

  /**
   * Add signature box
   */
  addSignatureBox(title: string, name?: string, noreg?: string): void {
    this.ensureSpace(30)

    this.doc.setFontSize(FONT_SIZE_BODY)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.options.margin || MARGIN, this.currentY)
    this.currentY += 5

    const boxWidth = 60
    const boxHeight = 20
    const x = this.options.margin || MARGIN

    // Draw signature box
    this.doc.rect(x, this.currentY, boxWidth, boxHeight)

    if (name) {
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`Nama: ${name}`, x + 3, this.currentY + 8)
    }

    if (noreg) {
      this.doc.text(`No. Reg: ${noreg}`, x + 3, this.currentY + 14)
    }

    this.doc.text('Tanda tangan:', x + 3, this.currentY + 18)

    this.currentY += boxHeight + 5
  }

  /**
   * Save PDF
   */
  save(filename?: string): void {
    this.doc.save(filename || this.options.filename || 'document.pdf')
  }

  /**
   * Get PDF blob
   */
  getBlob(): Blob {
    return this.doc.output('blob') as Blob
  }

  /**
   * Get PDF data URL
   */
  getDataUrl(): string {
    return this.doc.output('dataurlstring')
  }

  /**
   * Export HTML element as PDF (basic conversion)
   */
  static exportElement(element: HTMLElement, options: PdfOptions = {}): void {
    const pdf = new PdfGenerator(options)

    // Convert basic HTML structure to PDF
    const title = element.querySelector('h1, h2, h3')
    if (title) {
      pdf.addTitle(title.textContent || '')
    }

    // Process tables
    const tables = element.querySelectorAll('table')
    tables.forEach(table => {
      const headers: string[] = []
      const rows: string[][] = []

      // Get headers
      const headerCells = table.querySelectorAll('thead th, thead td')
      headerCells.forEach(cell => {
        headers.push(cell.textContent?.trim() || '')
      })

      // Get rows
      const tableRows = table.querySelectorAll('tbody tr')
      tableRows.forEach(row => {
        const rowData: string[] = []
        const cells = row.querySelectorAll('td')
        cells.forEach(cell => {
          rowData.push(cell.textContent?.trim() || '')
        })
        if (rowData.length > 0) {
          rows.push(rowData)
        }
      })

      if (headers.length > 0 || rows.length > 0) {
        pdf.addTable({ headers, rows })
      }
    })

    // Process checkboxes
    const checkboxes = element.querySelectorAll('input[type="checkbox"]')
    checkboxes.forEach(checkbox => {
      const label = checkbox.parentElement?.textContent?.trim() || ''
      pdf.addCheckbox(label, (checkbox as HTMLInputElement).checked)
    })

    // Process text content
    const paragraphs = element.querySelectorAll('p')
    paragraphs.forEach(p => {
      if (p.textContent?.trim()) {
        pdf.addParagraph(p.textContent.trim())
      }
    })

    pdf.save()
  }
}

/**
 * Reusable PDF export component hook
 */
export const usePdfExport = () => {
  const exportToPdf = (element: HTMLElement, filename: string = 'document.pdf') => {
    PdfGenerator.exportElement(element, { filename })
  }

  return { exportToPdf }
}

/**
 * Helper to export any asesmen form
 */
export async function exportAsesmenPdf(
  element: HTMLElement,
  options: {
    filename: string
    title?: string
    nomorSkema?: string
    jabatanKerja?: string
    tuk?: string
    asesor?: string[]
    asesi?: string
    tanggal?: string
  }
) {
  const pdf = new PdfGenerator()

  // Add title
  if (options.title) {
    pdf.addTitle(options.title)
    pdf.addSpace(3)
  }

  // Add identity section (simple text, not table)
  if (options.jabatanKerja) {
    pdf.addParagraph(`Judul: ${options.jabatanKerja}`)
  }
  if (options.nomorSkema) {
    pdf.addParagraph(`Nomor Skema: ${options.nomorSkema}`)
  }
  if (options.tuk) {
    pdf.addParagraph(`TUK: ${options.tuk}`)
  }
  if (options.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })) {
    pdf.addParagraph(`Tanggal: ${options.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`)
  }
  if (options.asesor && options.asesor.length > 0) {
    pdf.addParagraph(`Asesor: ${options.asesor.join(', ')}`)
  }
  if (options.asesi) {
    pdf.addParagraph(`Asesi: ${options.asesi}`)
  }
  pdf.addSpace(3)

  pdf.addSpace(5)

  // Export element content - simplified approach for complex tables
  const tables = element.querySelectorAll('table')
  tables.forEach(table => {
    // Check for complex table structures (colspan, rowspan)
    const hasComplexStructure = table.querySelector('[colspan], [rowspan]')
    const hasThead = table.querySelector('thead')

    // Skip complex tables like MAPA01 that use colspan/rowspan heavily
    if (hasComplexStructure) {
      // For complex tables, just extract text content
      const tableText = table.textContent?.trim()
      if (tableText) {
        // Split by common delimiters and add as paragraphs
        const lines = tableText.split(/\n+/).filter(line => line.trim().length > 10)
        lines.slice(0, 5).forEach(line => {
          if (line.trim()) {
            pdf.addParagraph(line.trim())
          }
        })
        pdf.addSpace(2)
      }
      return
    }

    // Process simple tables
    const headers: string[] = []
    const rows: string[][] = []

    // Try to get headers from thead
    if (hasThead) {
      const headerCells = table.querySelectorAll('thead th, thead td')
      headerCells.forEach(cell => {
        headers.push(cell.textContent?.trim() || '')
      })
    }

    // Get rows from tbody
    const tableRows = table.querySelectorAll('tbody tr')
    tableRows.forEach(row => {
      const rowData: string[] = []
      const cells = row.querySelectorAll('td, th')
      cells.forEach(cell => {
        let text = cell.textContent?.trim() || ''

        // Check for checkbox
        const checkbox = cell.querySelector('input[type="checkbox"]')
        if (checkbox) {
          text = (checkbox as HTMLInputElement).checked ? '✓' : '☐'
        }

        // Check for textarea
        const textarea = cell.querySelector('textarea')
        if (textarea && textarea.value) {
          text = textarea.value
        }

        rowData.push(text)
      })
      if (rowData.length > 0) {
        rows.push(rowData)
      }
    })

    // Only add table if we have valid structure
    const colCount = Math.max(headers.length, rows[0]?.length || 0)
    if (colCount > 0 && colCount <= 10 && rows.length > 0) {
      pdf.addTable({
        headers: headers.length > 0 ? headers : rows[0].map(() => ''),
        rows: headers.length === 0 ? rows.slice(1) : rows,
        styles: {
          fontSize: FONT_SIZE_SMALL,
          cellPadding: 2,
          headerBackground: '#cccccc',
          headerTextColor: '#000000'
        }
      })
      pdf.addSpace(3)
    }
  })

  // Process signature boxes
  const signatureSections = element.querySelectorAll('tbody tr td:first-child[colspan], table tr td:has(b)')
  signatureSections.forEach(section => {
    const text = section.textContent?.trim()
    if (text?.toLowerCase().includes('asesi') || text?.toLowerCase().includes('asesor')) {
      // This is a signature section
      const row = section.parentElement
      if (row) {
        const cells = row.querySelectorAll('td')
        let name = ''

        cells.forEach(cell => {
          const cellText = cell.textContent?.trim() || ''
          if (cellText && !cellText.includes(':')) {
            name = cellText
          }
        })

        pdf.addSignatureBox(text, name)
      }
    }
  })

  pdf.save(options.filename)
}
