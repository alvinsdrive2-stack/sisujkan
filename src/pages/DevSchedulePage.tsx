import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Download, Upload, Search, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type ScheduleStatus = 'planned' | 'in-progress' | 'done' | 'cancelled'

interface ScheduleItem {
  id: string
  date: string
  endDate?: string
  time: string
  activity: string
  assignee: string
  status: ScheduleStatus
  notes: string
}

type ScheduleForm = Omit<ScheduleItem, 'id'>

const STORAGE_KEY = 'dev_schedule_data'

const statusColors: Record<ScheduleStatus, string> = {
  planned: 'bg-slate-100 text-slate-700 border-slate-300',
  'in-progress': 'bg-amber-100 text-amber-700 border-amber-300',
  done: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
}

const statusBarColors: Record<ScheduleStatus, string> = {
  planned: 'bg-slate-400',
  'in-progress': 'bg-amber-400',
  done: 'bg-emerald-500',
  cancelled: 'bg-red-400',
}

const statusLabels: Record<ScheduleStatus, string> = {
  planned: 'Planned',
  'in-progress': 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const emptyForm: ScheduleForm = {
  date: '',
  endDate: '',
  time: '',
  activity: '',
  assignee: '',
  status: 'planned',
  notes: '',
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function loadSchedules(): ScheduleItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveSchedules(list: ScheduleItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function formatDateShort(d: string): string {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return `${dt.getDate()} ${monthNames[dt.getMonth()].slice(0, 3)}`
}

export default function DevSchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [form, setForm] = useState<ScheduleForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortAsc, setSortAsc] = useState(true)
  const [showChart, setShowChart] = useState(false)

  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  useEffect(() => {
    setSchedules(loadSchedules())
  }, [])

  function refresh() {
    setSchedules(loadSchedules())
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date || !form.activity) return
    const list = loadSchedules()
    if (editingId) {
      const idx = list.findIndex((s) => s.id === editingId)
      if (idx !== -1) list[idx] = { ...list[idx], ...form }
    } else {
      list.push({ ...form, id: generateId() })
    }
    saveSchedules(list)
    refresh()
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(item: ScheduleItem) {
    const { id: _id, ...rest } = item
    setForm(rest)
    setEditingId(item.id)
    setShowForm(true)
  }

  function handleDelete(id: string) {
    const list = loadSchedules().filter((s) => s.id !== id)
    saveSchedules(list)
    refresh()
    setDeleteId(null)
  }

  function handleExport() {
    const data = loadSchedules()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schedule-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(data)) throw new Error('Invalid format')
        saveSchedules(data)
        refresh()
      } catch {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Available months from data
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    schedules.forEach((s) => {
      if (s.date) months.add(s.date.slice(0, 7)) // YYYY-MM
      if (s.endDate) months.add(s.endDate.slice(0, 7))
    })
    return Array.from(months).sort()
  }, [schedules])

  // Filtered + sorted list
  const filtered = useMemo(() => {
    return schedules
      .filter((s) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          s.activity.toLowerCase().includes(q) ||
          s.assignee?.toLowerCase().includes(q) ||
          s.notes?.toLowerCase().includes(q)
        )
      })
      .filter((s) => {
        if (filterMonth !== 'all') {
          const itemStart = s.date?.slice(0, 7) || ''
          const itemEnd = s.endDate?.slice(0, 7) || itemStart
          // Include if item spans or starts or ends in selected month
          if (itemStart > filterMonth && itemEnd < filterMonth) return false
          if (itemStart <= filterMonth && itemEnd >= filterMonth) return true
          if (itemStart === filterMonth || itemEnd === filterMonth) return true
          return false
        }
        return true
      })
      .filter((s) => {
        if (filterDateFrom && s.date && s.date < filterDateFrom) {
          // Item ends before filter start
          if (s.endDate && s.endDate < filterDateFrom) return false
          if (!s.endDate && s.date < filterDateFrom) return false
        }
        if (filterDateTo && s.date && s.date > filterDateTo) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        const da = `${a.date}T${a.time || '00:00'}`
        const db = `${b.date}T${b.time || '00:00'}`
        return sortAsc ? da.localeCompare(db) : db.localeCompare(da)
      })
  }, [schedules, search, filterMonth, filterDateFrom, filterDateTo, sortAsc])

  // Hover tooltip state
  const [tooltip, setTooltip] = useState<{
    left: number; width: number; activity: string; startDate: string; endDate: string; status: ScheduleStatus; assignee: string
  } | null>(null)

  const handleBarHover = useCallback((_e: React.MouseEvent, bar: {
    activity: string; startDate: string; endDate: string; status: ScheduleStatus; assignee: string; left: number; width: number
  }) => {
    setTooltip({
      left: bar.left,
      width: bar.width,
      activity: bar.activity,
      startDate: bar.startDate,
      endDate: bar.endDate,
      status: bar.status,
      assignee: bar.assignee,
    })
  }, [])

  // Gantt chart data
  const ganttData = useMemo(() => {
    if (filtered.length === 0) return null

    let minDate = filtered[0].date
    let maxDate = filtered[0].endDate || filtered[0].date
    filtered.forEach((s) => {
      if (s.date && s.date < minDate) minDate = s.date
      const end = s.endDate || s.date
      if (end > maxDate) maxDate = end
    })

    // Expand range to full month boundaries
    const minY = parseInt(minDate.slice(0, 4))
    const minM = parseInt(minDate.slice(5, 7)) - 1
    minDate = `${minY}-${String(minM + 1).padStart(2, '0')}-01`

    const maxY = parseInt(maxDate.slice(0, 4))
    const maxM = parseInt(maxDate.slice(5, 7)) - 1
    const lastDay = daysInMonth(maxY, maxM)
    maxDate = `${maxY}-${String(maxM + 1).padStart(2, '0')}-${lastDay}`

    const start = new Date(minDate + 'T12:00:00')
    const end = new Date(maxDate + 'T12:00:00')
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)

    // Month headers
    const months: { label: string; width: number; offset: number }[] = []
    const cur = new Date(start)
    while (cur <= end) {
      const y = cur.getFullYear()
      const m = cur.getMonth()
      const dim = daysInMonth(y, m)
      const monthStart = new Date(y, m, 1)
      const offsetDays = Math.round((monthStart.getTime() - start.getTime()) / 86400000)
      const clipStart = Math.max(0, offsetDays)
      const clipEnd = Math.min(totalDays, offsetDays + dim)
      const width = clipEnd - clipStart
      if (width > 0) {
        months.push({
          label: `${monthNames[m]} ${y}`,
          width: (width / totalDays) * 100,
          offset: (clipStart / totalDays) * 100,
        })
      }
      cur.setMonth(cur.getMonth() + 1)
    }

    // Date ticks — every 7 days
    const dateTicks: { label: string; pos: number }[] = []
    const tickInterval = 7
    for (let d = 0; d < totalDays; d += tickInterval) {
      const tickDate = new Date(start.getTime() + d * 86400000)
      const day = tickDate.getDate()
      const mo = monthNames[tickDate.getMonth()].slice(0, 3)
      dateTicks.push({
        label: `${day} ${mo}`,
        pos: (d / totalDays) * 100,
      })
    }

    // Sunday strips
    const sundays: { pos: number }[] = []
    for (let d = 0; d < totalDays; d++) {
      const dt = new Date(start.getTime() + d * 86400000)
      if (dt.getDay() === 0) {
        sundays.push({ pos: (d / totalDays) * 100 })
      }
    }

    // Today position
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const todayOffset = Math.round((today.getTime() - start.getTime()) / 86400000)
    const todayPos = todayOffset >= 0 && todayOffset <= totalDays
      ? (todayOffset / totalDays) * 100
      : null

    // Bars
    const bars = filtered.map((s) => {
      const barStart = new Date(s.date + 'T12:00:00')
      const barEnd = new Date((s.endDate || s.date) + 'T12:00:00')
      const offsetDays = Math.round((barStart.getTime() - start.getTime()) / 86400000)
      const spanDays = Math.max(1, Math.round((barEnd.getTime() - barStart.getTime()) / 86400000) + 1)
      return {
        id: s.id,
        activity: s.activity,
        assignee: s.assignee,
        status: s.status,
        left: (offsetDays / totalDays) * 100,
        width: (spanDays / totalDays) * 100,
        startDate: s.date,
        endDate: s.endDate || s.date,
      }
    })

    return { totalDays, months, dateTicks, sundays, todayPos, bars }
  }, [filtered])

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">IT Developer Schedule</h1>
            <p className="mt-1 text-sm text-slate-500">LSP GKK — {schedules.length} items</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)}>
              <CalendarDays className="mr-1 h-4 w-4" /> {showChart ? 'Hide Chart' : 'Show Chart'}
            </Button>
            <label className="cursor-pointer">
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              <Button variant="outline" size="sm" type="button" asChild>
                <span><Upload className="mr-1 h-4 w-4" /> Import</span>
              </Button>
            </label>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1 h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Search activities, assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="all">Semua Bulan</option>
            {availableMonths.map((m) => {
              const [y, mo] = m.split('-')
              return (
                <option key={m} value={m}>
                  {monthNames[parseInt(mo) - 1]} {y}
                </option>
              )
            })}
          </select>
          <div className="flex items-center gap-1">
            <input
              type="date"
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              title="Dari tanggal"
            />
            <span className="text-xs text-slate-400">s/d</span>
            <input
              type="date"
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              title="Sampai tanggal"
            />
          </div>
          {(filterMonth !== 'all' || filterDateFrom || filterDateTo) && (
            <button
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => { setFilterMonth('all'); setFilterDateFrom(''); setFilterDateTo('') }}
            >
              Reset filter
            </button>
          )}
          <button
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            onClick={() => setSortAsc(!sortAsc)}
          >
            {sortAsc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {sortAsc ? 'Oldest first' : 'Newest first'}
          </button>
        </div>

        {/* Gantt Chart */}
        {showChart && ganttData && (
          <Card className="mb-6 overflow-hidden p-0">
            <div className="border-b bg-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Schedule Timeline</h2>
              <p className="text-xs text-slate-300">
                {formatDateShort(filtered[0]?.date)} — {formatDateShort(filtered[filtered.length - 1]?.endDate || filtered[filtered.length - 1]?.date)} ({filtered.length} items)
              </p>
            </div>

            <div className="overflow-x-auto">
              {/* Month headers */}
              <div className="flex border-b border-slate-200 bg-slate-100">
                <div className="w-48 shrink-0 border-r border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                  Aktivitas
                </div>
                <div className="relative flex-1" style={{ minWidth: 600 }}>
                  {ganttData.months.map((m, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-slate-200 px-1 py-2"
                      style={{ left: `${m.offset}%`, width: `${m.width}%` }}
                    >
                      <span className="truncate text-xs font-medium text-slate-600">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date tick row */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <div className="w-48 shrink-0 border-r border-slate-200" />
                <div className="relative flex-1" style={{ minWidth: 600, height: 22 }}>
                  {ganttData.dateTicks.map((t, i) => (
                    <div
                      key={i}
                      className="absolute top-0 flex flex-col items-center"
                      style={{ left: `${t.pos}%` }}
                    >
                      <div className="h-2 w-px bg-slate-300" />
                      <span className="text-[9px] leading-none text-slate-500">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bars */}
              <div className="divide-y divide-slate-100">
                {ganttData.bars.map((bar) => (
                  <div key={bar.id} className="flex hover:bg-slate-50">
                    <div className="w-48 shrink-0 border-r border-slate-100 px-3 py-2">
                      <p className="truncate text-xs font-medium text-slate-800">
                        {bar.activity}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        {formatDateShort(bar.startDate)}
                        {bar.startDate !== bar.endDate ? ` — ${formatDateShort(bar.endDate)}` : ''}
                      </p>
                    </div>
                    <div className="relative flex-1 py-2" style={{ minWidth: 600 }}>
                      {/* Sunday strips */}
                      {ganttData.sundays.map((s, si) => (
                        <div
                          key={si}
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-300 opacity-40 pointer-events-none"
                          style={{ left: `${s.pos}%` }}
                        />
                      ))}
                      {/* Today line inside timeline area */}
                      {ganttData.todayPos !== null && (
                        <div
                          className="absolute top-0 bottom-0 z-10 w-0.5 bg-red-500 opacity-50 pointer-events-none"
                          style={{ left: `${ganttData.todayPos}%` }}
                        />
                      )}
                      <div
                        className={`absolute top-1/2 h-6 -translate-y-1/2 rounded-md ${statusBarColors[bar.status]} cursor-pointer transition-all hover:brightness-110 hover:shadow-md`}
                        style={{ left: `${Math.max(0, bar.left)}%`, width: `${Math.max(0.5, bar.width)}%` }}
                        onMouseEnter={() => handleBarHover(null!, bar)}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <span className="mx-2 truncate text-[10px] font-semibold text-white drop-shadow-sm">
                          {bar.width > 5 ? bar.activity : ''}
                        </span>
                      </div>
                      {/* Inline tooltip for this bar */}
                      {tooltip?.activity === bar.activity && tooltip?.startDate === bar.startDate && (
                        <div
                          className="absolute z-50 pointer-events-none whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-white shadow-xl"
                          style={{
                            left: `${Math.max(0, bar.left)}%`,
                            bottom: '100%',
                            transform: 'translateX(0)',
                          }}
                        >
                          <p className="text-xs font-bold">{bar.activity}</p>
                          <p className="mt-0.5 text-[10px] text-slate-300">
                            {formatDateShort(bar.startDate)}
                            {bar.startDate !== bar.endDate ? ` — ${formatDateShort(bar.endDate)}` : ''}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`inline-block h-2 w-4 rounded ${statusBarColors[bar.status]}`} />
                            <span className="text-[10px] text-slate-300">{statusLabels[bar.status]}</span>
                            {bar.assignee && (
                              <span className="text-[10px] text-slate-400">• {bar.assignee}</span>
                            )}
                          </div>
                          <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 bg-slate-900" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 border-t border-slate-200 bg-slate-50 px-4 py-2">
              {(Object.entries(statusBarColors) as [ScheduleStatus, string][]).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`h-3 w-6 rounded ${color}`} />
                  <span className="text-[10px] text-slate-600">{statusLabels[status]}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {showChart && !ganttData && (
          <Card className="mb-6 p-8 text-center">
            <p className="text-sm text-slate-500">No data to chart. Add schedules first.</p>
          </Card>
        )}

        {/* Form Modal */}
        {showForm && (
          <Card className="mb-6 border-blue-200 bg-blue-50 p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Tanggal Mulai *</label>
                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Tanggal Selesai</label>
                  <input
                    name="endDate"
                    type="date"
                    value={form.endDate || ''}
                    onChange={handleChange}
                    min={form.date}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Waktu</label>
                  <input
                    name="time"
                    type="time"
                    value={form.time}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Assignee</label>
                  <input
                    name="assignee"
                    value={form.assignee}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. Alvin, Frontend"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Activity *</label>
                  <input
                    name="activity"
                    value={form.activity}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="What needs to be done?"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Optional details..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  {editingId ? 'Update' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Schedule List */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-500">
              {search || filterMonth !== 'all' || filterDateFrom || filterDateTo
                ? 'No matching schedules for this filter.'
                : 'No schedules yet. Click Add to create one.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <Card key={item.id} className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
                {/* Date block */}
                <div className="hidden w-20 shrink-0 text-center sm:block">
                  <div className="text-lg font-bold leading-tight text-slate-800">
                    {item.date ? item.date.slice(8) : '--'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {item.date ? new Date(item.date + 'T12:00:00').toLocaleString('en', { month: 'short' }) : ''}
                  </div>
                </div>

                {/* Time */}
                <div className="hidden w-14 shrink-0 text-sm font-medium text-slate-600 sm:block">
                  {item.time || '--:--'}
                </div>

                {/* Main content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {item.activity}
                    </span>
                    <Badge className={`border text-xs ${statusColors[item.status] || statusColors.planned}`}>
                      {statusLabels[item.status] || item.status}
                    </Badge>
                    {item.assignee && (
                      <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                        {item.assignee}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="sm:hidden">
                      {item.date} {item.time}
                    </span>
                    {item.endDate && item.endDate !== item.date && (
                      <span className="font-medium text-blue-600">
                        {item.date} → {item.endDate}
                      </span>
                    )}
                    {item.notes && <span className="truncate italic">— {item.notes}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-1">
                  <button
                    className="rounded-lg p-2 text-slate-500 hover:bg-blue-100 hover:text-blue-700"
                    onClick={() => handleEdit(item)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-100 hover:text-red-700"
                    onClick={() => setDeleteId(item.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule item?"
        confirmText="Delete"
        onConfirm={() => handleDelete(deleteId!)}
      />
    </div>
  )
}
