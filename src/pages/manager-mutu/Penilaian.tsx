import { useParams } from "react-router-dom"
import PenilaianForm from "./PenilaianForm"

export default function PenilaianPenyusun() {
  const { idIzin, jenis } = useParams()
  return (
    <PenilaianForm
      idIzin={idIzin!}
      jenis={jenis!}
      rolePrefix="penyusun"
      title="Penilaian Asesi"
      subtitle="Lihat jawaban asesi dan berikan nilai"
    />
  )
}
