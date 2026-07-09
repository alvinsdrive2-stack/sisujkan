import { useParams } from "react-router-dom"
import Ia04bKANPage from "@/pages/asesi/asesmen/Ia04bKANPage"
import Ia05KANPage from "@/pages/asesi/asesmen/Ia05KANPage"
import Ia06Page from "@/pages/asesi/asesmen/Ia06Page"

export default function PraktisiKerja() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <div className="p-12 text-center text-slate-400">ID Izin tidak ditemukan</div>
  }

  return (
    <div className="space-y-8">
      <Ia04bKANPage />
      <Ia05KANPage />
      <Ia06Page />
    </div>
  )
}
