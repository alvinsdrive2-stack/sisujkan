export default function Penilaian() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Penilaian Asesi</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Lihat jawaban asesi dan berikan nilai</p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 dark:text-yellow-400 text-sm">
            <strong>Mode Mockup:</strong> Halaman penilaian akan muncul setelah memilih asesi dari daftar skema.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Nama Asesi</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">[Data Asesi]</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Skema</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">[Nama Skema]</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Tahap</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">IA.04B / IA.05 / IA.06</p>
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-6">
        <p className="text-slate-500 dark:text-slate-400 text-center py-12">
          Pilih asesi dari daftar skema untuk mulai penilaian.
        </p>
      </div>
    </div>
  )
}
