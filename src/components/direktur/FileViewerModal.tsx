import { X, ExternalLink, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SimpleSpinner } from "@/components/ui/loading-spinner"

interface FileItem {
  label: string
  url?: string | null
}

interface FileViewerModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  files: FileItem[]
  isLoading?: boolean
  theme?: 'primary' | 'emerald'
}

export function FileViewerModal({ isOpen, onClose, title, files, isLoading, theme = 'primary' }: FileViewerModalProps) {
  if (!isOpen) return null

  const openFile = (url: string) => {
    window.open(url, '_blank')
  }

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Error downloading file:', err)
    }
  }

  const themeColors = theme === 'emerald'
    ? { bg: 'from-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-500', btn: 'text-emerald-600 hover:bg-emerald-50' }
    : { bg: 'from-primary/10', border: 'border-primary/20', icon: 'text-primary', btn: 'text-primary hover:bg-primary/10' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r ${themeColors.bg} to-transparent`}>
          <div className="flex items-center gap-2">
            <FileText className={`w-5 h-5 ${themeColors.icon}`} />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <SimpleSpinner size="md" className={themeColors.icon} />
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    file.url
                      ? `${themeColors.border} bg-gradient-to-r ${themeColors.bg} to-transparent`
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                  } transition-colors`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${file.url ? themeColors.bg.replace('/10', '/20') : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <FileText className={`h-4 w-4 ${file.url ? themeColors.icon : 'text-slate-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${file.url ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {file.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {file.url ? 'Tersedia' : 'Belum tersedia'}
                      </p>
                    </div>
                  </div>

                  {file.url && (
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${themeColors.btn}`}
                        onClick={() => openFile(file.url!)}
                        title="Buka di tab baru"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        onClick={() => downloadFile(file.url!, `${file.label.replace(/\s+/g, '_')}.pdf`)}
                        title="Unduh"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Klik <ExternalLink className="h-3 w-3 inline mx-0.5" /> untuk buka atau <Download className="h-3 w-3 inline mx-0.5" /> untuk unduh
          </p>
        </div>
      </div>
    </div>
  )
}
