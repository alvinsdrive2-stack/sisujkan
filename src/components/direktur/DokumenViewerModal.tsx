import { createPortal } from "react-dom"
import { X, Download, ExternalLink, FileText, Check } from "lucide-react"
import { useEffect } from "react"

interface DokumenViewerModalProps {
  isOpen: boolean
  onClose: () => void
  url: string | null
  title: string
  onSign?: () => void
  isSigning?: boolean
}

export function DokumenViewerModal({ isOpen, onClose, url, title, onSign, isSigning }: DokumenViewerModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const isPdf = typeof url === 'string' && url.endsWith('.pdf')
  const hasUrl = typeof url === 'string'

  const content = (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[99999] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-slate-800">
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isPdf ? (
            <iframe
              src={url + '#toolbar=0&navpanes=0'}
              className="w-full h-full border-0"
              title={title}
            />
          ) : hasUrl ? (
            <img
              src={url}
              alt={title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
              <FileText className="w-16 h-16 text-primary/30" />
              <p className="text-lg font-medium">Dokumen tidak tersedia</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center">
          <div className="flex gap-2">
            {hasUrl && (
              <>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Buka di tab baru"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <a
                  href={url}
                  download
                  className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </a>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              {onSign ? 'Batal' : 'Tutup'}
            </button>
            {onSign && (
              <button
                onClick={onSign}
                disabled={isSigning}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSigning ? (
                  'Memproses...'
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Tanda Tangan
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
