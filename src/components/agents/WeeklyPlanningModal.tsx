'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const EMPLOYEES = [
  { initial: 'M', name: 'Marcus Mathurin', color: '#E8914A' },
  { initial: 'N', name: 'Nicky Antoine', color: '#5B8DEF' },
  { initial: 'W', name: 'William Joseph-Julien', color: '#4CAF82' },
]

const COL_DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']
const COL_DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

type DayPlan = { M: string; N: string; W: string }
type MonthData = Record<number, DayPlan> // key = day-of-month 1..31

function emptyDay(): DayPlan { return { M: '', N: '', W: '' } }

function getMonthStart(year: number, month: number): Date {
  return new Date(year, month, 1)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Returns 0=Mon..6=Sun
function dayOfWeekMon(date: Date): number {
  return (date.getDay() + 6) % 7
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function monthLabelUpper(year: number, month: number): string {
  return new Date(year, month, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .toUpperCase()
}

async function imageToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// Build week rows: array of 7-element arrays (null = outside month)
function buildCalendarWeeks(year: number, month: number): (number | null)[][] {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = dayOfWeekMon(getMonthStart(year, month))
  const weeks: (number | null)[][] = []
  let week: (number | null)[] = Array(firstDow).fill(null)

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

async function generatePDF(year: number, month: number, data: MonthData): Promise<string> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = 297
  const pageH = 210
  const mL = 8
  const mR = 8
  const mB = 8

  const weeks = buildCalendarWeeks(year, month)
  const generated = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // ── Header band ────────────────────────────────────────────────────────────
  const headerH = 18
  doc.setFillColor(26, 26, 26)
  doc.rect(0, 0, pageW, headerH, 'F')

  const logoB64 = await imageToBase64('/agents/rosa_logo.png')
  if (logoB64) {
    doc.setFillColor(255, 255, 255)
    doc.circle(mL + 11, headerH / 2, 10, 'F')
    doc.addImage(logoB64, 'PNG', mL + 1, headerH / 2 - 9, 20, 20)
  }

  // Title center
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(`PLANNING ${monthLabelUpper(year, month)}`, pageW / 2, headerH / 2 + 1, { align: 'center' })

  // Subtitle center
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(170, 170, 170)
  doc.text('Rosa Excavator — Rental and Service', pageW / 2, headerH / 2 + 6, { align: 'center' })

  // Date generated right
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(6)
  doc.text(`Généré le ${generated}`, pageW - mR, headerH / 2 + 1, { align: 'right' })

  // ── Legend row ────────────────────────────────────────────────────────────
  const legendY = headerH + 5
  doc.setFontSize(6)
  let lx = pageW - mR
  EMPLOYEES.slice().reverse().forEach((emp) => {
    const tw = doc.getTextWidth(emp.name)
    doc.setTextColor(100, 100, 100)
    doc.text(emp.name, lx - tw, legendY)
    const r = parseInt(emp.color.slice(1, 3), 16)
    const g = parseInt(emp.color.slice(3, 5), 16)
    const b = parseInt(emp.color.slice(5, 7), 16)
    doc.setFillColor(r, g, b)
    doc.rect(lx - tw - 3.5, legendY - 2.5, 2.5, 2.5, 'F')
    lx = lx - tw - 6
  })

  // ── Calendar table ────────────────────────────────────────────────────────
  const tableTop = legendY + 4
  const colHeaderH = 9
  const footerH = 8
  const availTableH = pageH - mB - footerH - tableTop - colHeaderH
  const rowH = availTableH / weeks.length
  const availW = pageW - mL - mR
  const colW = availW / 7

  // Column headers
  COL_DAYS.forEach((day, c) => {
    const x = mL + c * colW
    const isWeekend = c >= 5
    doc.setFillColor(isWeekend ? 55 : 35, isWeekend ? 55 : 35, isWeekend ? 55 : 35)
    doc.rect(x, tableTop, colW, colHeaderH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(day, x + colW / 2, tableTop + colHeaderH / 2 + 1.5, { align: 'center' })
  })

  // Week rows
  weeks.forEach((week, rowIdx) => {
    const rowY = tableTop + colHeaderH + rowIdx * rowH

    week.forEach((dayNum, colIdx) => {
      const x = mL + colIdx * colW
      const isWeekend = colIdx >= 5
      const isEmpty = dayNum === null

      // Cell background
      if (isEmpty) {
        doc.setFillColor(240, 240, 240)
      } else if (isWeekend) {
        doc.setFillColor(248, 248, 248)
      } else {
        doc.setFillColor(255, 255, 255)
      }
      doc.rect(x, rowY, colW, rowH, 'F')

      // Cell border
      doc.setDrawColor(210, 210, 210)
      doc.setLineWidth(0.3)
      doc.rect(x, rowY, colW, rowH, 'S')

      if (dayNum === null) return

      const plan = data[dayNum] || emptyDay()
      const vals = [plan.M, plan.N, plan.W]

      // Date number — top left
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(50, 50, 50)
      doc.text(String(dayNum), x + 2.5, rowY + 5)

      // Employee entries
      const entryStartY = rowY + 9
      const entryH = (rowH - 9) / 3

      EMPLOYEES.forEach((emp, eIdx) => {
        const ey = entryStartY + eIdx * entryH
        const text = vals[eIdx]?.trim()
        if (!text) return

        // Colored left accent bar
        const er = parseInt(emp.color.slice(1, 3), 16)
        const eg = parseInt(emp.color.slice(3, 5), 16)
        const eb = parseInt(emp.color.slice(5, 7), 16)
        doc.setFillColor(er, eg, eb)
        doc.rect(x + 1, ey + 0.5, 1.5, entryH - 1, 'F')

        // Initial bold
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(60, 60, 60)
        doc.text(emp.initial, x + 4, ey + entryH / 2 + 1)

        // Task text
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(80, 80, 80)
        // Truncate if too long
        const maxW = colW - 8
        let taskText = text
        while (doc.getTextWidth(taskText) > maxW && taskText.length > 1) {
          taskText = taskText.slice(0, -1)
        }
        if (taskText !== text) taskText = taskText.slice(0, -1) + '…'
        doc.text(taskText, x + 7.5, ey + entryH / 2 + 1)
      })
    })
  })

  // Outer table border
  doc.setDrawColor(160, 160, 160)
  doc.setLineWidth(0.5)
  doc.rect(mL, tableTop, availW, colHeaderH + weeks.length * rowH, 'S')

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = pageH - mB - 2
  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.3)
  doc.line(mL, footerY - 4, pageW - mR, footerY - 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(136, 136, 136)
  doc.text(
    'Rosa Excavator  |  +596 696 34 31 21  |  contact@rosaexcavator.com  |  SIRET: 952 827 186 00018',
    pageW / 2,
    footerY,
    { align: 'center' }
  )

  return doc.output('datauristring')
}

// ─── Form UI ─────────────────────────────────────────────────────────────────

interface Props {
  clientSlug: string
  onClose: () => void
}

export default function WeeklyPlanningModal({ clientSlug, onClose }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const [data, setData] = useState<MonthData>({})
  const [generating, setGenerating] = useState(false)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function setValue(day: number, emp: 'M' | 'N' | 'W', val: string) {
    setData(prev => ({
      ...prev,
      [day]: { ...(prev[day] || emptyDay()), [emp]: val },
    }))
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const pdfDataUri = await generatePDF(year, month, data)
      const base64 = pdfDataUri.split(',')[1]
      const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`

      const supabase = createClient()
      await supabase.from('plannings').upsert({
        client_slug: clientSlug,
        week_start: monthStart,
        planning_data: data,
        pdf_base64: base64,
        created_at: new Date().toISOString(),
      }, { onConflict: 'client_slug,week_start' })

      const link = document.createElement('a')
      link.href = pdfDataUri
      link.download = `planning-${year}-${String(month + 1).padStart(2, '0')}.pdf`
      link.click()

      toast.success('PDF généré et téléchargé !')
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la génération du PDF')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const weeks = buildCalendarWeeks(year, month)
  const daysInMonth = getDaysInMonth(year, month)

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 flex-shrink-0"
        style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}
      >
        <h2 className="text-white font-bold text-base">Planning mensuel</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* Month selector */}
        <div className="flex items-center justify-center gap-4 px-4 py-4">
          <button onClick={prevMonth} style={{ color: '#C4607A' }}>
            <ChevronLeft size={22} />
          </button>
          <span className="text-white text-sm font-bold capitalize" style={{ minWidth: 160, textAlign: 'center' }}>
            {monthLabel(year, month)}
          </span>
          <button onClick={nextMonth} style={{ color: '#C4607A' }}>
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Calendar mini-grid for navigation context */}
        <div className="px-4 mb-2">
          <div className="grid grid-cols-7 gap-px mb-1">
            {COL_DAYS.map(d => (
              <div key={d} className="text-center text-xs font-bold py-1" style={{ color: '#C4607A' }}>
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-px mb-0.5">
              {week.map((dayNum, di) => (
                <div
                  key={di}
                  className="text-center text-xs py-1 rounded"
                  style={{
                    color: dayNum ? (di >= 5 ? '#888' : '#ccc') : 'transparent',
                    backgroundColor: dayNum && data[dayNum] && Object.values(data[dayNum]).some(v => v.trim()) ? '#C4607A22' : 'transparent',
                  }}
                >
                  {dayNum || ''}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Day entries */}
        <div className="px-4 flex flex-col gap-3 mt-2">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const date = new Date(year, month, day)
            const dow = dayOfWeekMon(date) // 0=Mon..6=Sun
            const dayLabel = COL_DAYS_FULL[dow]
            const isWeekend = dow >= 5
            const dayPlan = data[day] || emptyDay()
            const empKeys: ('M' | 'N' | 'W')[] = ['M', 'N', 'W']

            return (
              <div
                key={day}
                className="rounded-xl overflow-hidden"
                style={{
                  border: '1px solid #2a2a2a',
                  opacity: isWeekend ? 0.6 : 1,
                }}
              >
                {/* Day header */}
                <div
                  className="px-3 py-2 text-xs font-bold tracking-wider"
                  style={{
                    borderBottom: '1px solid #2a2a2a',
                    backgroundColor: '#161616',
                    color: isWeekend ? '#888' : '#fff',
                  }}
                >
                  {dayLabel.toUpperCase()} {day} {new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                </div>

                {/* Employee rows */}
                {EMPLOYEES.map((emp, eIdx) => (
                  <div
                    key={emp.initial}
                    className="flex items-center gap-3 px-3 py-2"
                    style={{
                      borderBottom: eIdx < 2 ? '1px solid #2a2a2a' : undefined,
                      backgroundColor: '#0F0F0F',
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: emp.color, fontSize: 10 }}
                    >
                      {emp.initial}
                    </div>
                    <span className="text-xs flex-shrink-0 w-28" style={{ color: '#999' }}>
                      {emp.name}
                    </span>
                    <input
                      type="text"
                      value={dayPlan[empKeys[eIdx]]}
                      onChange={e => setValue(day, empKeys[eIdx], e.target.value)}
                      placeholder="Chantier..."
                      className="flex-1 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none transition-colors"
                      style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sticky bottom button */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 py-4"
        style={{ backgroundColor: '#0F0F0F', borderTop: '1px solid #2a2a2a' }}
      >
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #C4607A',
            color: '#C4607A',
            height: '52px',
          }}
        >
          {generating ? 'Génération...' : 'Générer le PDF'}
        </button>
      </div>
    </div>
  )
}
