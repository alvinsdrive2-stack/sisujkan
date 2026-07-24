import { useParams, useNavigate } from "react-router-dom"
import { SoalKosongPreview } from "@/components/SoalKosongPreview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Eye } from "lucide-react"

export default function SoalKosong() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/manajers/daftar-skema")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Soal KAN</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">{id}</Badge>
            <span className="text-slate-400">— Preview soal kosong</span>
          </p>
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="w-4 h-4 text-primary" />
            Preview Soal
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Tampilan soal kosong (template) untuk jabker <strong>{id}</strong>. Data diambil dari soal yang sudah di-upload penyusun.
        </CardContent>
      </Card>

      {/* Soal Preview */}
      {id && <SoalKosongPreview jabkerId={id} />}
    </div>
  )
}
