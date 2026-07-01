import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { extractErrorMessage } from "@/lib/error-utils"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/toast"
import UuidStepIndicator from "@/components/UuidStepIndicator"
import { API_BASE_URL } from "@/config/api"
import { Upload, Check, AlertCircle, Send, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const EXAMPLE_IMAGES = {
  ruangan: 'https://lspgatensi.id/files/images/ajj1.jpeg',
  laptop: 'https://lspgatensi.id/files/images/ajj2.jpg',
  jaringan: 'https://lspgatensi.id/files/images/ajj3.jpg',
}

const STEPS = [
  { id: 1, label: 'Foto Ruangan Uji', type: 'ruangan' },
  { id: 2, label: 'Spesifikasi Laptop', type: 'laptop' },
  { id: 3, label: 'Spesifikasi Jaringan', type: 'jaringan' },
]

export default function VerifikasiTukAjjPage() {
  const { idIzin } = useParams<{ idIzin: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [ruanganUjiImages, setRuanganUjiImages] = useState<File[]>([])
  const [laptopImages, setLaptopImages] = useState<File[]>([])
  const [jaringanImages, setJaringanImages] = useState<File[]>([])
  const [jadwalId, setJadwalId] = useState<string | undefined>()
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const uuidData = sessionStorage.getItem('praasesmen_uuid_data')
    if (uuidData) {
      const parsed = JSON.parse(uuidData)
      setJadwalId(parsed.jadwal_id)
    }
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewImage(null) }
    if (previewImage) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [previewImage])

  const handleFileChange = (files: FileList | null, type: 'ruangan' | 'laptop' | 'jaringan') => {
    if (!files) return
    const newFiles = Array.from(files)
    if (type === 'ruangan') setRuanganUjiImages(newFiles)
    else if (type === 'laptop') setLaptopImages(newFiles)
    else setJaringanImages(newFiles)
  }

  const removeFile = (type: 'ruangan' | 'laptop' | 'jaringan', index: number) => {
    if (type === 'ruangan') setRuanganUjiImages(prev => prev.filter((_, i) => i !== index))
    else if (type === 'laptop') setLaptopImages(prev => prev.filter((_, i) => i !== index))
    else setJaringanImages(prev => prev.filter((_, i) => i !== index))
  }

  const getFilesForType = (type: string) => {
    if (type === 'ruangan') return ruanganUjiImages
    if (type === 'laptop') return laptopImages
    return jaringanImages
  }

  const handleSubmit = async () => {

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("jadwal_id", jadwalId ?? "")
      formData.append("id_izin", idIzin ?? "")

      ruanganUjiImages.forEach(file => formData.append("ruangan_uji_images[]", file))
      laptopImages.forEach(file => formData.append("laptop_images[]", file))
      jaringanImages.forEach(file => formData.append("kecepatan_jaringan_images[]", file))

      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/pengajuan-tuk/ajj/submit`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (result.status === "success" || result.success) {
        toast("Verifikasi TUK AJJ berhasil diajukan", "success")
        navigate(`/praasesmen/${idIzin}/konfirmasi`, { replace: true })
      } else {
        toast(result.message || "Gagal mengirim verifikasi", "error")
      }
    } catch (error) {
      toast(extractErrorMessage(error, "Terjadi kesalahan. Silakan coba lagi."), "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    const files = getFilesForType(STEPS[currentTab - 1].type)
    if (files.length === 0) {
      toast("Harap upload minimal 1 gambar", "error")
      return
    }
    if (!completedSteps.includes(currentTab)) {
      setCompletedSteps([...completedSteps, currentTab])
    }
    if (currentTab < 3) setCurrentTab(currentTab + 1)
  }

  const renderUploadArea = (type: 'ruangan' | 'laptop' | 'jaringan', files: File[], title: string, hint: string) => (
    <div
      className="border-2 border-dashed border-blue-300 rounded-lg p-5 text-center cursor-pointer transition-colors bg-blue-50/30 hover:bg-blue-50"
      onClick={() => {
        const input = document.getElementById(`upload-${type}`) as HTMLInputElement
        input?.click()
      }}
    >
      <input
        id={`upload-${type}`}
        type="file"
        accept=".png,.jpg,.jpeg"
        multiple
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files, type)}
      />
      {files.length === 0 ? (
        <>
          <Upload size={24} className="text-blue-600 mx-auto opacity-70" />
          <p className="text-sm font-medium text-blue-600 mt-2 mb-0.5">{title}</p>
          <span className="text-xs text-gray-400">{hint}</span>
        </>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-blue-200 group cursor-pointer"
              onClick={(e) => { e.stopPropagation(); removeFile(type, idx) }}
            >
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity">×</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderExampleImage = (src: string, alt: string, aspect: string) => (
    <div
      className={`${aspect} bg-gray-100 rounded-lg border border-gray-200 overflow-hidden cursor-pointer group`}
      onClick={() => setPreviewImage(src)}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        crossOrigin="anonymous"
      />
    </div>
  )

  const renderTabContent = () => {
    const step = STEPS[currentTab - 1]

    if (step.id === 1) {
      return (
        <Card className="mb-4 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-white">{step.id}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Ruangan Uji, Meja dan Kursi</h3>
              <p className="text-xs text-gray-500">Ruangan uji yang tersedia: meja dan kursi</p>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Spesifikasi</p>
                <ul className="space-y-2">
                  {['Ruangan Tertutup', 'Meja dan Kursi', 'Tersedia Kelistrikan', 'Pencahayaan yang cukup'].map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contoh foto</p>
                {renderExampleImage(EXAMPLE_IMAGES.ruangan, 'Contoh ruangan uji', 'aspect-[4/3]')}
              </div>
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5 mb-4">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="text-xs text-amber-800">Ruangan harus terlihat secara jelas keseluruhan dan dengan pencahayaan yang cukup.</span>
            </div>
            {renderUploadArea('ruangan', ruanganUjiImages, 'Klik untuk upload foto', 'JPG, PNG · Maks. 5MB')}
          </CardContent>
        </Card>
      )
    }

    if (step.id === 2) {
      return (
        <Card className="mb-4 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-white">{step.id}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Spesifikasi Laptop</h3>
              <p className="text-xs text-gray-500">Spesifikasi minimal untuk Zoom dan aplikasi Smart Galensi</p>
            </div>
          </div>
          <CardContent className="p-5">
            {/* Foto specs + Spesifikasi side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-5 mb-4">
              <div className="sm:col-span-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contoh screenshot spesifikasi laptop</p>
                {renderExampleImage(EXAMPLE_IMAGES.laptop, 'Contoh spesifikasi laptop', 'aspect-video')}
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Spesifikasi Minimal</p>
                <ul className="space-y-2">
                  {[
                    'Laptop',
                    'Minimal Webcam Default',
                    'Minimal Windows 10',
                    'Minimal RAM 4 Gb',
                    'Minimal Memory 256 Gb',
                    'Browser Google Chrome',
                    'Tersedia Aplikasi Zoom Meeting',
                  ].map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Cara screenshot - compact horizontal */}
            <div className="bg-blue-50/50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cara screenshot spesifikasi</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                {[
                  'Tekan Win + R',
                  'Ketik dxdiag',
                  'Tekan Enter',
                  'Screenshot hasilnya',
                ].map((item, i) => (
                  <span key={i} className="text-sm text-gray-600 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            {renderUploadArea('laptop', laptopImages, 'Klik untuk upload foto', 'JPG, PNG · Maks. 5MB')}
          </CardContent>
        </Card>
      )
    }

    if (step.id === 3) {
      return (
        <Card className="mb-4 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-white">{step.id}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Kecepatan Jaringan</h3>
              <p className="text-xs text-gray-500">Hasil speedtest koneksi internet yang akan digunakan</p>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
              <span className="text-sm font-bold text-blue-700">Minimal 10 Mbps</span>
              <span className="text-xs text-blue-600">— Kecepatan internet yang disarankan untuk kelancaran asesmen</span>
            </div>
            {/* Langkah-langkah compact */}
            
            {/* Foto tengah besar */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contoh hasil speedtest</p>
              {renderExampleImage(EXAMPLE_IMAGES.jaringan, 'Contoh speedtest', 'aspect-video')}
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Langkah-langkah</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {[
                  'Buka speedtest.net',
                  'Klik "Go"',
                  'Tunggu selesai',
                  'Screenshot hasil',
                ].map((item, i) => (
                  <span key={i} className="text-sm text-gray-600 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            {renderUploadArea('jaringan', jaringanImages, 'Klik untuk upload foto', 'JPG, PNG · Maks. 5MB')}
          </CardContent>
        </Card>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading && <FullPageLoader text="Memproses..." />}

      <div className="max-w-[680px] mx-auto px-4 py-6">
        <UuidStepIndicator currentStep={0} isVerifikasiPage={true} />

        <h1 className="text-xl font-semibold text-center text-blue-600 mb-1">
          Dokumentasi Sarana Prasarana
        </h1>
        <p className="text-xs text-center text-gray-500 mb-6">
          TUK Sewaktu · Upload 3 foto sesuai petunjuk untuk kelengkapan verifikasi
        </p>

        {/* Step Nodes */}
        <div className="flex justify-center items-center mb-6">
          {STEPS.map((step, idx) => {
            const isActive = currentTab === step.id
            const isCompleted = completedSteps.includes(step.id)
            const canClick = completedSteps.includes(step.id) || step.id === 1 || completedSteps.includes(step.id - 1)
            const isLast = idx === STEPS.length - 1
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => { if (canClick) setCurrentTab(step.id) }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={[
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                      isCompleted ? 'bg-green-500 text-white' : '',
                      isActive && !isCompleted ? 'bg-blue-600 text-white ring-4 ring-blue-200' : '',
                      !isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : '',
                    ].join(' ')}
                  >
                    {isCompleted ? <Check size={16} /> : step.id}
                  </div>
                  <span
                    className={[
                      'text-[11px] text-center leading-tight max-w-[72px]',
                      isActive || isCompleted ? 'text-gray-700 font-semibold' : 'text-gray-400',
                    ].join(' ')}
                  >
                    {step.label}
                  </span>
                </button>
                {!isLast && (
                  <div
                    className={[
                      'w-12 sm:w-16 h-0.5 mb-6 mx-1.5 sm:mx-2.5',
                      step.id <= currentTab || completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-gray-200',
                    ].join(' ')}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Tab Content */}
        {renderTabContent()}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 mb-2">
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <span><strong>Penting:</strong> Pastikan semua foto jelas dan menunjukkan kondisi fasilitas yang sebenarnya.</span>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          {currentTab < 3 ? (
            <button
              onClick={handleNext}
              className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              Lanjut
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={[
                'w-full rounded-lg px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors',
                isLoading ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 text-white hover:bg-blue-700',
              ].join(' ')}
            >
              {isLoading ? 'Memproses...' : (
                <>
                  <Send size={20} />
                  Submit Verifikasi
                </>
              )}
            </button>
          )}
        </div>

        {/* Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setPreviewImage(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none cursor-pointer z-10"
              onClick={() => setPreviewImage(null)}
            >
              ×
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
              crossOrigin="anonymous"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

      </div>
    </div>
  )
}
