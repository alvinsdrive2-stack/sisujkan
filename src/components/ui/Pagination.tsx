import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

interface PaginationProps {
  page: number
  lastPage: number
  total: number
  perPage: number
  onPageChange: (page: number) => void
}

function getPageNumbers(current: number, last: number): (number | "...")[] {
  if (last <= 6) return Array.from({ length: last }, (_, i) => i + 1)

  const pages: (number | "...")[] = [1]

  let rangeStart = Math.max(2, current - 1)
  let rangeEnd = Math.min(last - 1, current + 1)

  if (current <= 3) {
    rangeStart = 2
    rangeEnd = Math.min(4, last - 1)
  } else if (current >= last - 2) {
    rangeStart = Math.max(last - 3, 2)
    rangeEnd = last - 1
  }

  if (rangeStart > 2) pages.push("...")
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
  if (rangeEnd < last - 1) pages.push("...")
  if (last > 1) pages.push(last)

  return pages
}

export function Pagination({ page, lastPage, total, perPage, onPageChange }: PaginationProps) {
  const [gotoInput, setGotoInput] = useState("")

  if (lastPage <= 1) return null

  const pages = getPageNumbers(page, lastPage)
  const start = ((page - 1) * perPage) + 1
  const end = Math.min(page * perPage, total)

  const handleGoto = () => {
    const num = parseInt(gotoInput)
    if (num >= 1 && num <= lastPage) {
      onPageChange(num)
      setGotoInput("")
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200">
      <div className="text-sm text-slate-600">
        {start}-{end} dari {total}
      </div>

      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-slate-400 select-none">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-primary text-white shadow-sm"
                  : "border border-slate-300 hover:bg-slate-50 text-slate-700"
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage}
          className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Go to page */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-600">Ke halaman</span>
        <input
          type="number"
          min={1}
          max={lastPage}
          value={gotoInput}
          onChange={(e) => setGotoInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGoto()}
          className="w-16 h-9 border border-slate-300 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="1"
        />
        <button
          onClick={handleGoto}
          disabled={!gotoInput}
          className="h-9 px-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Go
        </button>
      </div>
    </div>
  )
}
