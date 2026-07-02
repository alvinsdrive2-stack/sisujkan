export default function PenilaianValidator() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Penilaian Asesi — Validator</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Review penilaian penyusun dan berikan validasi</p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <span className="text-yellow-600 dark:text-yellow-400 text-sm">
          <strong>Mode Mockup:</strong> Halaman penilaian validator — pilih asesi dari daftar skema.
        </span>
      </div>

      <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-6">
        <p className="text-slate-500 dark:text-slate-400 text-center py-12">
          Pilih skema dan asesi untuk mulai validasi penilaian.
        </p>
      </div>
    </div>
  )
}
