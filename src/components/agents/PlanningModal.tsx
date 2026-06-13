'use client'

import { useState } from 'react'
import { X, FileDown } from 'lucide-react'
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
const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAYS_SHORT_PDF = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

function jsToMon(d: number) { return (d + 6) % 7 }

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const last = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= last; d++) days.push(new Date(year, month, d))
  return days
}

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

function isWeekend(d: Date) {
  return d.getDay() === 0 || d.getDay() === 6
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

async function buildPDF(
  year: number,
  month: number,
  days: Record<string, DayData>
): Promise<import('jspdf').jsPDF> {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const logo = await loadLogo()

  const PW = 297, PH = 210
  const ML = 8, MR = 8
  const usableW = PW - ML - MR

  // ── Header bar ──────────────────────────────────────────────
  const headerH = 32
  doc.setFillColor(26, 26, 26)
  doc.rect(0, 0, PW, headerH, 'F')

  if (logo) {
    doc.setFillColor(255, 255, 255)
    doc.circle(ML + 10, headerH / 2, 10, 'F')
    doc.addImage(logo, 'PNG', ML, headerH / 2 - 10, 20, 20)
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(
    `PLANNING ${MONTHS_FR[month].toUpperCase()} ${year}`,
    PW / 2, headerH / 2 - 1,
    { align: 'center' }
  )
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Rosa Excavator - Rental and Service', PW / 2, headerH / 2 + 8, { align: 'center' })

  // ── Column headers ───────────────────────────────────────────
  const colHeaderTop = headerH + 2
  const colHeaderH = 7
  const colW = usableW / 7
  doc.setFillColor(45, 45, 45)
  doc.rect(ML, colHeaderTop, usableW, colHeaderH, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  DAYS_SHORT_PDF.forEach((d, i) => {
    const isWE = i >= 5
    if (isWE) doc.setTextColor(196, 96, 122)
    else doc.setTextColor(255, 255, 255)
    doc.text(d, ML + i * colW + colW / 2, colHeaderTop + 5, { align: 'center' })
  })

  // ── Weeks ─────────────────────────────────────────────────────
  const weeks = getMonthWeeks(year, month)
  const tableStart = colHeaderTop + colHeaderH
  const footerH = 10
  const availH = PH - tableStart - footerH
  const rowH = Math.max(20, Math.floor(availH / weeks.length))

  weeks.forEach((week, wi) => {
    const rowY = tableStart + wi * rowH
    const rowBg: [number, number, number] = wi % 2 === 0 ? [255, 255, 255] : [250, 250, 250]

    week.forEach((day, di) => {
      const cellX = ML + di * colW
      const isWE = di >= 5
      const cellBg: [number, number, number] = day
        ? (isWE ? [245, 245, 245] : rowBg)
        : [255, 255, 255]
      doc.setFillColor(...cellBg)
      doc.rect(cellX, rowY, colW, rowH, 'F')
      doc.setDrawColor(224, 224, 224)
      doc.rect(cellX, rowY, colW, rowH, 'S')

      if (!day) return
      const data = days[dateKey(day)] ?? { marcus: '', nicky: '', william: '', notes: '' }

      // Date number
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(51, 51, 51)
      doc.text(String(day.getDate()), cellX + 2, rowY + 5.5)

      // Employee lines
      const lineH = (rowH - 8) / 4
      const entries: [string, string, [number, number, number]][] = [
        ['M:', data.marcus, [51, 51, 51]],
        ['N:', data.nicky, [51, 51, 51]],
        ['W:', data.william, [51, 51, 51]],
        ['', data.notes, [120, 120, 120]],
      ]
      entries.forEach(([prefix, val, color], ei) => {
        if (!val) return
        const ly = rowY + 8 + ei * lineH
        doc.setFont('helvetica', ei === 3 ? 'italic' : 'normal')
        doc.setFontSize(ei === 3 ? 7 : 8)
        doc.setTextColor(...color)
        const label = prefix
        const content = doc.splitTextToSize(val, colW - (prefix ? 6 : 4))[0] ?? ''
        if (prefix) {
          doc.setFont('helvetica', 'bold')
          doc.text(label, cellX + 1.5, ly)
          doc.setFont('helvetica', 'normal')
          doc.text(content, cellX + 5, ly)
        } else {
          doc.setFont('helvetica', 'italic')
          doc.text(content, cellX + 1.5, ly)
        }
      })
    })
  })

  // ── Footer ────────────────────────────────────────────────────
  const footerY = PH - footerH + 2
  doc.setDrawColor(224, 224, 224)
  doc.line(ML, footerY, PW - MR, footerY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(160, 160, 160)
  doc.text(
    'Rosa Excavator  |  +596 696 34 31 21  |  contact@rosaexcavator.com  |  SIRET : 952 827 186 00018',
    PW / 2, footerY + 4, { align: 'center' }
  )

  return doc
}

function buildTextSummary(year: number, month: number, allDays: Date[], days: Record<string, DayData>): string {
  const lines: string[] = [`PLANNING ${MONTHS_FR[month].toUpperCase()} ${year}`, '']
  allDays.forEach(day => {
    const data = days[dateKey(day)]
    if (!data || (!data.marcus && !data.nicky && !data.william)) return
    lines.push(`${DAYS_FR[day.getDay()]} ${day.getDate()} ${MONTHS_FR[month]}`)
    if (data.marcus) lines.push(`- Marcus Mathurin : ${data.marcus}`)
    if (data.nicky) lines.push(`- Nicky Antoine : ${data.nicky}`)
    if (data.william) lines.push(`- William Joseph-Julien : ${data.william}`)
    if (data.notes) lines.push(`  Note : ${data.notes}`)
    lines.push('')
  })
  return lines.join('\n')
}

export default function PlanningModal({ clientSlug, onClose, onPlanningCreated }: PlanningModalProps) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [days, setDays] = useState<Record<string, DayData>>({})
  const [generating, setGenerating] = useState(false)

  const allDays = getDaysInMonth(year, month)
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  function setField(key: string, field: keyof DayData, val: string) {
    setDays(prev => {
      const existing: DayData = prev[key] ?? { marcus: '', nicky: '', william: '', notes: '' }
      return { ...prev, [key]: { ...existing, [field]: val } }
    })
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const doc = await buildPDF(year, month, days)
      const pdfBase64 = doc.output('datauristring')

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

      doc.save(`planning-${MONTHS_FR[month].toLowerCase()}-${year}.pdf`)

      const summary = buildTextSummary(year, month, allDays, days)
      onPlanningCreated(summary)
      onClose()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#1a1a1a', paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 min-h-[44px] flex items-center"
        >
          <X size={20} />
        </button>
        <h2 className="text-white font-semibold text-base flex-1">Planning mensuel</h2>
      </div>

      {/* Month / Year selectors */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#1a1a1a' }}>
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="px-3 py-2 rounded-lg text-white font-medium flex-1"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', fontSize: '16px' }}
        >
          {MONTHS_FR.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="px-3 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', fontSize: '16px' }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Day list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {allDays.map(day => {
          const key = dateKey(day)
          const data = days[key] ?? { marcus: '', nicky: '', william: '', notes: '' }
          const weekend = isWeekend(day)
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div
              key={key}
              className="rounded-xl p-3"
              style={{
                backgroundColor: weekend ? '#111' : '#0f0f0f',
                border: `1px solid ${isToday ? '#C4607A' : weekend ? '#222' : '#1a1a1a'}`,
              }}
            >
              {/* Day label */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: isToday ? '#C4607A' : weekend ? '#222' : '#1a1a1a',
                    color: isToday ? '#fff' : weekend ? '#888' : '#aaa',
                  }}
                >
                  {DAYS_FR[day.getDay()]} {day.getDate()}
                </span>
                {weekend && (
                  <span className="text-[10px] text-zinc-600">week-end</span>
                )}
              </div>

              {/* Inputs */}
              <div className="space-y-1.5">
                {[
                  { label: 'Marcus', field: 'marcus' as keyof DayData, color: '#a78bfa' },
                  { label: 'Nicky', field: 'nicky' as keyof DayData, color: '#34d399' },
                  { label: 'William', field: 'william' as keyof DayData, color: '#60a5fa' },
                ].map(({ label, field, color }) => (
                  <div key={field} className="flex items-center gap-2">
                    <span className="text-xs font-semibold w-16 shrink-0" style={{ color }}>
                      {label}
                    </span>
                    <input
                      type="text"
                      value={data[field]}
                      onChange={e => setField(key, field, e.target.value)}
                      placeholder="Chantier..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-white placeholder-zinc-700 text-sm outline-none focus:ring-1 transition-all"
                      style={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        fontSize: '16px',
                        // @ts-expect-error focus-ring color
                        '--tw-ring-color': color,
                      }}
                    />
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold w-16 shrink-0 text-zinc-600">Notes</span>
                  <input
                    type="text"
                    value={data.notes}
                    onChange={e => setField(key, 'notes', e.target.value)}
                    placeholder="Notes..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-zinc-400 placeholder-zinc-700 text-sm outline-none transition-all"
                    style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', fontSize: '16px' }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky generate button */}
      <div
        className="px-4 py-3 flex-shrink-0 border-t"
        style={{ borderColor: '#1a1a1a', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-base disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#C4607A' }}
        >
          <FileDown size={18} />
          {generating ? 'Génération en cours...' : 'Générer le PDF'}
        </button>
      </div>
    </div>
  )
}
