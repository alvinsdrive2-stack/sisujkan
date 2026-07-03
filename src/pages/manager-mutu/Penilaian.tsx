import { useParams } from "react-router-dom"
import PenilaianForm from "../penyusun/PenilaianForm"

export default function PenilaianManagerMutu() {
  const { idIzin, jenis } = useParams()
  return (
    <PenilaianForm
      idIzin={idIzin!}
      jenis={jenis!}
      rolePrefix="manager-mutu"
      title="Penilaian Asesi — Manager Mutu"
      subtitle="Review penilaian dan berikan tanda tangan"
    />
  )
}
