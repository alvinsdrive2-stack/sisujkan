export default function MukResult() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Hasil MUK</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Lihat hasil MUK participant dan status tanda tangan</p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <span className="text-yellow-600 dark:text-yellow-400 text-sm">
          <strong>Mode Mockup:</strong> Halaman MUK akan tampil setelah memilih participant tertentu.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Nama Peserta</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">[Nama Peserta]</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Skema</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">[Nama Skema]</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">Status TTD</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">[Belum / Sudah]</p>
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-6">
        <p className="text-slate-500 dark:text-slate-400 text-center py-12">
          Data MUK akan ditampilkan di sini.
        </p>
      </div>
    </div>
  )
}
