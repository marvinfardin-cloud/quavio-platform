'use client'

import { useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DayData {
  marcus: string
  nicky: string
  william: string
  notes: string
}

interface PlanningModalProps {
  clientSlug: string
  onClose: () => void
  onPlanningCreated: (textSummary: string) => void
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_FULL = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']

// js getDay(): 0=Sun,1=Mon...6=Sat → convert to 0=Mon..6=Sun
function jsToMon(d: number) { return (d + 6) % 7 }

function getMonthWeeks(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startOffset = jsToMon(first.getDay())
  const weeks: (Date | null)[][] = []
  let week: (Date | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= last.getDate(); d++) {
    week.push(new Date(year, month, d))
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch('/agents/rosa_logo.png')
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

async function buildPlanningPdf(
  year: number,
  month: number,
  weeks: (Date | null)[][],
  days: Record<string, DayData>
): Promise<import('jspdf').jsPDF> {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const logo = await loadLogo()

  const PW = 297, PH = 210
  const ML = 8, MR = 8
  const usableW = PW - ML - MR

  // ── Header ──────────────────────────────────────────────────
  doc.setFillColor(26, 26, 26)
  doc.rect(0, 0, PW, 36, 'F')
  if (logo) {
    doc.setFillColor(255, 255, 255)
    doc.circle(ML + 11, 18, 11, 'F')
    doc.addImage(logo, 'PNG', ML, 7, 22, 22)
  }
  const tx = logo ? ML + 28 : ML + 4
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(`PLANNING ${MONTHS_FR[month].toUpperCase()} ${year}`, tx, 17)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(180, 180, 180)
  doc.text('Rosa Excavator — Rental and Service', tx, 27)

  // ── Day header row ───────────────────────────────────────────
  const colW = usableW / 7
  const tableTop = 38
  const headerH = 8
  doc.setFillColor(45, 45, 45)
  doc.rect(ML, tableTop, usableW, headerH, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  DAYS_FULL.forEach((day, i) => {
    doc.text(day, ML + i * colW + colW / 2, tableTop + 5.5, { align: 'center' })
  })

  // ── Week rows ────────────────────────────────────────────────
  const nWeeks = weeks.length
  const availH = PH - tableTop - headerH - 14 // leave room for footer
  const rowH = Math.floor(availH / nWeeks)

  weeks.forEach((week, wi) => {
    const rowY = tableTop + headerH + wi * rowH
    const bg: [number, number, number] = wi % 2 === 0 ? [255, 255, 255] : [248, 248, 248]
    doc.setFillColor(...bg)
    doc.rect(ML, rowY, usableW, rowH, 'F')
    doc.setDrawColor(224, 224, 224)
    doc.line(ML, rowY, ML + usableW, rowY)

    week.forEach((day, di) => {
      const cellX = ML + di * colW
      // vertical divider
      doc.setDrawColor(224, 224, 224)
      doc.line(cellX, rowY, cellX, rowY + rowH)

      if (!day) return
      const data = days[dateKey(day)] ?? { marcus: '', nicky: '', william: '', notes: '' }

      // Date number
      doc.setTextColor(51, 51, 51)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text(String(day.getDate()), cellX + 2, rowY + 5)

      // Employee lines
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      const lineH = (rowH - 7) / 3
      const names: [string, string][] = [
        ['M.', data.marcus],
        ['N.', data.nicky],
        ['W.', data.william],
      ]
      names.forEach(([initial, val], ni) => {
        const ly = rowY + 8 + ni * lineH
        if (!val) return
        doc.setTextColor(140, 140, 140)
        doc.text(initial, cellX + 2, ly)
        doc.setTextColor(26, 26, 26)
        const maxW = colW - 8
        const wrapped = doc.splitTextToSize(val, maxW)
        doc.text(wrapped[0] ?? '', cellX + 6, ly)
      })
    })
  })

  // Bottom border
  const tableBottom = tableTop + headerH + nWeeks * rowH
  doc.setDrawColor(224, 224, 224)
  doc.line(ML, tableBottom, ML + usableW, tableBottom)
  doc.line(ML + usableW, tableTop, ML + usableW, tableBottom)

  // ── Footer ───────────────────────────────────────────────────
  doc.setDrawColor(224, 224, 224)
  doc.line(ML, PH - 8, PW - MR, PH - 8)
  doc.setTextColor(160, 160, 160)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(
    'Rosa Excavator  |  SIRET : 952 827 186 00018  |  +596 696 34 31 21  |  contact@rosaexcavator.com',
    PW / 2, PH - 4, { align: 'center' }
  )

  return doc
}

function buildTextSummary(
  year: number,
  month: number,
  weeks: (Date | null)[][],
  days: Record<string, DayData>
): string {
  const lines: string[] = [`PLANNING ${MONTHS_FR[month].toUpperCase()} ${year}`, '']
  weeks.forEach((week) => {
    week.forEach((day) => {
      if (!day) return
      const data = days[dateKey(day)]
      if (!data || (!data.marcus && !data.nicky && !data.william)) return
      const dayName = DAYS_FULL[jsToMon(day.getDay())]
      lines.push(`${dayName} ${day.getDate()} ${MONTHS_FR[month]}`)
      if (data.marcus) lines.push(`- Marcus Mathurin : ${data.marcus}`)
      if (data.nicky) lines.push(`- Nicky Antoine : ${data.nicky}`)
      if (data.william) lines.push(`- William Joseph-Julien : ${data.william}`)
      if (data.notes) lines.push(`  Note : ${data.notes}`)
      lines.push('')
    })
  })
  return lines.join('\n')
}

export default function PlanningModal({ clientSlug, onClose, onPlanningCreated }: PlanningModalProps) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [days, setDays] = useState<Record<string, DayData>>({})
  const [mobileWeekIdx, setMobileWeekIdx] = useState(0)
  const [generating, setGenerating] = useState(false)

  const weeks = getMonthWeeks(year, month)

  const setDay = useCallback((key: string, field: keyof DayData, val: string) => {
    setDays(prev => {
      const existing: DayData = prev[key] ?? { marcus: '', nicky: '', william: '', notes: '' }
      return { ...prev, [key]: { ...existing, [field]: val } }
    })
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const doc = await buildPlanningPdf(year, month, weeks, days)
      const pdfBase64 = doc.output('datauristring')

      // Save to Supabase
      try {
        const supabase = createClient()
        await supabase.from('plannings').insert({
          client_slug: clientSlug,
          month,
          year,
          planning_data: days,
          pdf_base64: pdfBase64,
        })
      } catch (e) { console.error('Failed to save planning:', e) }

      // Download
      doc.save(`planning-${MONTHS_FR[month].toLowerCase()}-${year}.pdf`)

      // Send summary to Zara chat
      const summary = buildTextSummary(year, month, weeks, days)
      onPlanningCreated(summary)
      onClose()
    } finally {
      setGenerating(false)
    }
  }

  function DayCell({ day, compact }: { day: Date | null; compact?: boolean }) {
    if (!day) {
      return (
        <div
          className="rounded-lg"
          style={{
            backgroundColor: '#0d0d0d',
            border: '1px solid #1a1a1a',
            minHeight: compact ? '120px' : '160px',
          }}
        />
      )
    }
    const key = dateKey(day)
    const data = days[key] ?? { marcus: '', nicky: '', william: '', notes: '' }
    const isToday = day.toDateString() === new Date().toDateString()

    return (
      <div
        className="rounded-lg p-2 flex flex-col gap-1"
        style={{
          backgroundColor: '#111',
          border: `1px solid ${isToday ? '#C4607A' : '#1a1a1a'}`,
          minHeight: compact ? '120px' : '160px',
        }}
      >
        <span
          className="text-xs font-bold leading-none mb-1 self-start px-1 py-0.5 rounded"
          style={{
            color: isToday ? '#fff' : '#999',
            backgroundColor: isToday ? '#C4607A' : 'transparent',
          }}
        >
          {day.getDate()}
        </span>
        {[
          { label: 'Marcus', field: 'marcus' as keyof DayData, color: '#a78bfa' },
          { label: 'Nicky', field: 'nicky' as keyof DayData, color: '#34d399' },
          { label: 'William', field: 'william' as keyof DayData, color: '#60a5fa' },
        ].map(({ label, field, color }) => (
          <div key={field} className="flex items-center gap-1">
            <span className="text-[9px] font-medium shrink-0 w-12 truncate" style={{ color }}>
              {label}
            </span>
            <input
              type="text"
              value={data[field]}
              onChange={e => setDay(key, field, e.target.value)}
              placeholder="—"
              className="flex-1 min-w-0 text-[11px] bg-transparent border-b outline-none text-white placeholder-zinc-700 focus:placeholder-zinc-600 transition-colors"
              style={{ borderColor: '#2a2a2a', fontSize: '11px' }}
            />
          </div>
        ))}
        <input
          type="text"
          value={data.notes}
          onChange={e => setDay(key, 'notes', e.target.value)}
          placeholder="Notes..."
          className="text-[10px] bg-transparent border-none outline-none text-zinc-600 placeholder-zinc-700 mt-auto"
          style={{ fontSize: '10px' }}
        />
      </div>
    )
  }

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#1a1a1a', paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 min-h-[44px] flex items-center">
          <X size={20} />
        </button>
        <h2 className="text-white font-semibold text-base flex-1">Générateur de planning</h2>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90 min-h-[44px]"
          style={{ backgroundColor: '#C4607A' }}
        >
          <FileDown size={15} />
          {generating ? 'Génération...' : 'Générer PDF'}
        </button>
      </div>

      {/* Month / Year selector */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#1a1a1a' }}>
        <select
          value={month}
          onChange={e => { setMonth(Number(e.target.value)); setMobileWeekIdx(0) }}
          className="px-3 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', fontSize: '16px' }}
        >
          {MONTHS_FR.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={e => { setYear(Number(e.target.value)); setMobileWeekIdx(0) }}
          className="px-3 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', fontSize: '16px' }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-zinc-500 text-sm ml-auto">
          {MONTHS_FR[month]} {year}
        </span>
      </div>

      {/* Calendar — Desktop: full month grid */}
      <div className="hidden lg:flex flex-col flex-1 overflow-y-auto px-4 py-3">
        {/* Day headers */}
        <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-xs font-semibold uppercase tracking-wider py-1" style={{ color: '#555' }}>
              {d}
            </div>
          ))}
        </div>
        {/* Weeks */}
        <div className="flex flex-col gap-1 flex-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid gap-1 flex-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {week.map((day, di) => (
                <DayCell key={di} day={day} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar — Mobile: week by week */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden">
        {/* Week navigation */}
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <button
            onClick={() => setMobileWeekIdx(i => Math.max(0, i - 1))}
            disabled={mobileWeekIdx === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm disabled:opacity-30 text-zinc-400 min-h-[44px]"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <ChevronLeft size={16} />
            Préc.
          </button>
          <span className="text-zinc-400 text-sm">
            Semaine {mobileWeekIdx + 1} / {weeks.length}
          </span>
          <button
            onClick={() => setMobileWeekIdx(i => Math.min(weeks.length - 1, i + 1))}
            disabled={mobileWeekIdx === weeks.length - 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm disabled:opacity-30 text-zinc-400 min-h-[44px]"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            Suiv.
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day column headers */}
        <div className="grid px-3 pt-2 pb-1 gap-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#555' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Current week cells */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {(weeks[mobileWeekIdx] ?? []).map((day, di) => (
              <DayCell key={di} day={day} compact />
            ))}
          </div>
        </div>

        {/* Mobile generate button */}
        <div className="px-4 py-3 flex-shrink-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold disabled:opacity-50"
            style={{ backgroundColor: '#C4607A' }}
          >
            <FileDown size={16} />
            {generating ? 'Génération en cours...' : 'Générer le planning PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
