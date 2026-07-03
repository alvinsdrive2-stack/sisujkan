import { useParams } from "react-router-dom"
import PenilaianForm from "../penyusun/PenilaianForm"

export default function PenilaianValidator() {
  const { idIzin, jenis } = useParams()
  return (
    <PenilaianForm
      idIzin={idIzin!}
      jenis={jenis!}
      rolePrefix="validator"
      title="Penilaian Asesi — Validator"
      subtitle="Review penilaian penyusun dan berikan validasi"
    />
  )
}
