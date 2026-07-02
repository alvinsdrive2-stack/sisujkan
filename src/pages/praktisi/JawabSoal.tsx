export default function JawabSoal() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Jawab Soal</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Flow asesmen — ikuti tahapan berikut</p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <span className="text-yellow-600 dark:text-yellow-400 text-sm">
          <strong>Mode Mockup:</strong> Halaman ini akan mengikuti flow asesi (APL.01 → APL.02 → MUK → Asesmen steps → TTD) dengan endpoint prefix <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">/praktisi/</code>.
        </span>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["APL.01", "APL.02", "MUK", "IA.04B", "IA.05", "IA.06", "TTD"].map((step, i) => (
          <div key={step} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            i === 0
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              : i < 6
              ? "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
              : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          }`}>
            {step}
            {i < 6 && <span className="text-slate-300 dark:text-slate-600">→</span>}
          </div>
        ))}
      </div>

      <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-6">
        <p className="text-slate-500 dark:text-slate-400 text-center py-12">
          Pilih jabker dari dashboard untuk memulai flow jawab soal.
        </p>
      </div>
    </div>
  )
}
