'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPLOYEES = [
  { initial: 'M', name: 'Marcus Mathurin',       color: '#E8914A' },
  { initial: 'N', name: 'Nicky Antoine',          color: '#5B8DEF' },
  { initial: 'W', name: 'William Joseph-Julien',  color: '#4CAF82' },
]

const COL_HEADERS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']
const COL_DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

// ─── Types ────────────────────────────────────────────────────────────────────

type DayPlan   = { M: string; N: string; W: string }
type MonthData = Record<number, DayPlan>   // key = 1..31

// ─── Date helpers ─────────────────────────────────────────────────────────────

function emptyDay(): DayPlan { return { M: '', N: '', W: '' } }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

/** 0=Mon … 6=Sun */
function dow(date: Date): number {
  return (date.getDay() + 6) % 7
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function monthLabelUpper(year: number, month: number) {
  return monthLabel(year, month).toUpperCase()
}

function shortMonthFR(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
}

/** Builds rows of 7 (null = outside month) */
function buildWeeks(year: number, month: number): (number | null)[][] {
  const total = getDaysInMonth(year, month)
  const firstDow = dow(new Date(year, month, 1))
  const weeks: (number | null)[][] = []
  let row: (number | null)[] = Array(firstDow).fill(null)
  for (let d = 1; d <= total; d++) {
    row.push(d)
    if (row.length === 7) { weeks.push(row); row = [] }
  }
  if (row.length) {
    while (row.length < 7) row.push(null)
    weeks.push(row)
  }
  return weeks
}

// ─── Image helper ─────────────────────────────────────────────────────────────

async function toBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise(resolve => {
      const r = new FileReader()
      r.onloadend = () => resolve(r.result as string)
      r.onerror   = () => resolve(null)
      r.readAsDataURL(blob)
    })
  } catch { return null }
}

// ─── PDF generation ───────────────────────────────────────────────────────────

async function generatePDF(year: number, month: number, data: MonthData): Promise<string> {
  const doc   = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W     = 297
  const H     = 210
  const mL    = 8
  const mR    = 8
  const mB    = 8

  const weeks   = buildWeeks(year, month)
  const nWeeks  = weeks.length
  const genDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const hdrH = 20
  doc.setFillColor(28, 28, 28)
  doc.rect(0, 0, W, hdrH, 'F')

  // Logo (white circle bg)
  const logo = await toBase64('/agents/rosa_logo.png')
  if (logo) {
    doc.setFillColor(255, 255, 255)
    doc.circle(mL + 10, hdrH / 2, 9, 'F')
    doc.addImage(logo, 'PNG', mL + 1.5, hdrH / 2 - 8.5, 17, 17)
  } else {
    doc.setFillColor(255, 255, 255)
    doc.circle(mL + 10, hdrH / 2, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(28, 28, 28)
    doc.text('R', mL + 10, hdrH / 2 + 1.5, { align: 'center' })
  }

  // Month title — centered, large
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(`PLANNING — ${monthLabelUpper(year, month)}`, W / 2, hdrH / 2 + 1, { align: 'center' })

  // Subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(160, 160, 160)
  doc.text('Rosa Excavator — Rental and Service', W / 2, hdrH / 2 + 6, { align: 'center' })

  // Generated date — right
  doc.setFontSize(6)
  doc.setTextColor(110, 110, 110)
  doc.text(`Généré le ${genDate}`, W - mR, hdrH / 2 + 1, { align: 'right' })

  // ── LEGEND ──────────────────────────────────────────────────────────────────
  const legendY = hdrH + 5
  let lx = W - mR
  doc.setFontSize(6)
  EMPLOYEES.slice().reverse().forEach(emp => {
    const tw = doc.getTextWidth(emp.name)
    doc.setTextColor(100, 100, 100)
    doc.text(emp.name, lx - tw, legendY)
    const [er, eg, eb] = [1, 3, 5].map(i => parseInt(emp.color.slice(i, i + 2), 16))
    doc.setFillColor(er, eg, eb)
    doc.rect(lx - tw - 3.5, legendY - 2.5, 2.5, 2.5, 'F')
    lx -= tw + 7
  })

  // ── TABLE ───────────────────────────────────────────────────────────────────
  const tableTop  = legendY + 4
  const colHdrH   = 9
  const footerH   = 8
  const availH    = H - mB - footerH - tableTop - colHdrH
  const rowH      = availH / nWeeks
  const availW    = W - mL - mR
  const colW      = availW / 7

  // Column headers
  COL_HEADERS.forEach((label, c) => {
    const x          = mL + c * colW
    const isWeekend  = c >= 5
    doc.setFillColor(isWeekend ? 60 : 38, isWeekend ? 60 : 38, isWeekend ? 60 : 38)
    doc.rect(x, tableTop, colW, colHdrH, 'F')

    doc.setFont('helvetica', 'bold')
    // Shrink font if text too wide
    const maxFontSize = 7.5
    let fs = maxFontSize
    doc.setFontSize(fs)
    while (doc.getTextWidth(label) > colW - 2 && fs > 5) {
      fs -= 0.3
      doc.setFontSize(fs)
    }
    doc.setTextColor(255, 255, 255)
    doc.text(label, x + colW / 2, tableTop + colHdrH / 2 + 1.5, { align: 'center' })
  })

  // Week rows
  weeks.forEach((week, ri) => {
    const rowY = tableTop + colHdrH + ri * rowH

    week.forEach((dayNum, ci) => {
      const x         = mL + ci * colW
      const isWeekend = ci >= 5
      const outOfMonth = dayNum === null

      // Cell background
      if (outOfMonth)    doc.setFillColor(238, 238, 238)
      else if (isWeekend) doc.setFillColor(245, 245, 245)
      else                doc.setFillColor(255, 255, 255)
      doc.rect(x, rowY, colW, rowH, 'F')

      // Cell border
      doc.setDrawColor(210, 210, 210)
      doc.setLineWidth(0.25)
      doc.rect(x, rowY, colW, rowH, 'S')

      if (!dayNum) return

      const plan = data[dayNum] || emptyDay()
      const vals = [plan.M, plan.N, plan.W]

      // Date number — top-left
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(40, 40, 40)
      doc.text(String(dayNum), x + 2.5, rowY + 6)

      // Employee lines — below date number
      const entryAreaTop = rowY + 8
      const entryAreaH   = rowH - 8
      const lineH        = entryAreaH / 3

      EMPLOYEES.forEach((emp, ei) => {
        const ey   = entryAreaTop + ei * lineH
        const text = vals[ei]?.trim()
        if (!text) return

        // Left color bar
        const [er, eg, eb] = [1, 3, 5].map(i => parseInt(emp.color.slice(i, i + 2), 16))
        doc.setFillColor(er, eg, eb)
        doc.rect(x + 1, ey + 0.8, 1.5, lineH - 1.5, 'F')

        // Initial (bold)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(55, 55, 55)
        doc.text(emp.initial, x + 4, ey + lineH / 2 + 1.2)

        // Task text (normal) — truncate to fit
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(70, 70, 70)
        const maxW = colW - 9
        let t = text
        while (doc.getTextWidth(t) > maxW && t.length > 1) t = t.slice(0, -1)
        if (t !== text) t = t.slice(0, -1) + '…'
        doc.text(t, x + 7.5, ey + lineH / 2 + 1.2)
      })
    })
  })

  // Outer border
  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.5)
  doc.rect(mL, tableTop, availW, colHdrH + nWeeks * rowH, 'S')

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const fy = H - mB
  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.3)
  doc.line(mL, fy - 4, W - mR, fy - 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(130, 130, 130)
  doc.text(
    'Rosa Excavator  |  +596 696 34 31 21  |  contact@rosaexcavator.com  |  SIRET: 952 827 186 00018',
    W / 2, fy, { align: 'center' }
  )

  return doc.output('datauristring')
}

// ─── Modal UI ─────────────────────────────────────────────────────────────────

interface Props {
  clientSlug: string
  onClose: () => void
}

export default function WeeklyPlanningModal({ clientSlug, onClose }: Props) {
  const now = new Date()
  const [year,       setYear]       = useState(now.getFullYear())
  const [month,      setMonth]      = useState(now.getMonth())
  const [data,       setData]       = useState<MonthData>({})
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
      const base64     = pdfDataUri.split(',')[1]
      const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`

      const supabase = createClient()
      await supabase.from('plannings').upsert(
        { client_slug: clientSlug, week_start: monthStart, planning_data: data, pdf_base64: base64, created_at: new Date().toISOString() },
        { onConflict: 'client_slug,week_start' }
      )

      const link = document.createElement('a')
      link.href     = pdfDataUri
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

  const weeks       = buildWeeks(year, month)
  const daysInMonth = getDaysInMonth(year, month)
  const empKeys: ('M' | 'N' | 'W')[] = ['M', 'N', 'W']

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

      {/* Scroll area */}
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

        {/* Mini calendar (read-only overview) */}
        <div className="px-4 mb-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <div key={i} className="text-center text-xs font-bold py-1" style={{ color: i >= 5 ? '#666' : '#C4607A' }}>
                {d}
              </div>
            ))}
          </div>
          {/* Week rows */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((dayNum, di) => {
                const hasPlan = dayNum !== null && data[dayNum] && Object.values(data[dayNum]).some(v => v.trim())
                return (
                  <div
                    key={di}
                    className="text-center text-xs py-1 rounded-sm mx-0.5"
                    style={{
                      color: dayNum ? (di >= 5 ? '#777' : '#aaa') : 'transparent',
                      backgroundColor: hasPlan ? '#C4607A33' : 'transparent',
                      fontWeight: hasPlan ? 600 : 400,
                    }}
                  >
                    {dayNum || ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Day entries */}
        <div className="px-4 flex flex-col gap-3">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const date      = new Date(year, month, day)
            const d         = dow(date)
            const isWeekend = d >= 5
            const dayPlan   = data[day] || emptyDay()

            return (
              <div
                key={day}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid #2a2a2a', opacity: isWeekend ? 0.6 : 1 }}
              >
                {/* Day label */}
                <div
                  className="px-3 py-2 text-xs font-bold tracking-wider"
                  style={{ borderBottom: '1px solid #2a2a2a', backgroundColor: '#161616', color: isWeekend ? '#777' : '#fff' }}
                >
                  {COL_DAYS_FULL[d].toUpperCase()} {day} {shortMonthFR(year, month)}
                </div>

                {/* Employee rows */}
                {EMPLOYEES.map((emp, ei) => (
                  <div
                    key={emp.initial}
                    className="flex items-center gap-3 px-3 py-2"
                    style={{ borderBottom: ei < 2 ? '1px solid #2a2a2a' : undefined, backgroundColor: '#0F0F0F' }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: emp.color, fontSize: 10 }}
                    >
                      {emp.initial}
                    </div>
                    <span className="text-xs w-28 flex-shrink-0" style={{ color: '#888' }}>
                      {emp.name}
                    </span>
                    <input
                      type="text"
                      value={dayPlan[empKeys[ei]]}
                      onChange={e => setValue(day, empKeys[ei], e.target.value)}
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

      {/* Generate button */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 py-4"
        style={{ backgroundColor: '#0F0F0F', borderTop: '1px solid #2a2a2a' }}
      >
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #C4607A', color: '#C4607A', height: '52px' }}
        >
          {generating ? 'Génération...' : 'Générer le PDF'}
        </button>
      </div>
    </div>
  )
}
