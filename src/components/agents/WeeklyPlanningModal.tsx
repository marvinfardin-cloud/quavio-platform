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

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

type DayPlanning = { M: string; N: string; W: string }
type WeekPlanning = DayPlanning[]

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(date: Date, short = false): string {
  const opts: Intl.DateTimeFormatOptions = short
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'long', year: 'numeric' }
  return date.toLocaleDateString('fr-FR', opts)
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase()
}

function emptyWeek(): WeekPlanning {
  return Array.from({ length: 6 }, () => ({ M: '', N: '', W: '' }))
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

async function generatePDF(monday: Date, planning: WeekPlanning): Promise<string> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = 297
  const pageH = 210
  const margin = 12

  const saturday = addDays(monday, 5)
  const weekLabel = `PLANNING SEMAINE DU ${formatDate(monday).toUpperCase()} AU ${formatDate(saturday).toUpperCase()}`
  const generated = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Header band
  const headerH = 22
  doc.setFillColor(26, 26, 26)
  doc.rect(0, 0, pageW, headerH, 'F')

  // Logo
  const logoBase64 = await imageToBase64('/agents/rosa_logo.png')
  if (logoBase64) {
    // White circle bg
    doc.setFillColor(255, 255, 255)
    doc.circle(margin + 13, headerH / 2, 13, 'F')
    doc.addImage(logoBase64, 'PNG', margin + 1, headerH / 2 - 12, 24, 24)
  }

  // Center text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(weekLabel, pageW / 2, headerH / 2 - 2, { align: 'center' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255, 0.6 as unknown as number)
  // jsPDF doesn't support rgba in setTextColor easily, use gray
  doc.setTextColor(160, 160, 160)
  doc.text('Rosa Excavator — Rental and Service', pageW / 2, headerH / 2 + 5, { align: 'center' })

  // Right: date generated
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(6)
  doc.text(`Généré le ${generated}`, pageW - margin, headerH / 2, { align: 'right' })

  // Color legend
  const legendY = headerH + 5
  doc.setFontSize(6)
  let legendX = pageW - margin
  EMPLOYEES.slice().reverse().forEach((emp) => {
    const label = `${emp.name}  `
    const textW = doc.getTextWidth(label)
    doc.setTextColor(100, 100, 100)
    doc.text(emp.name, legendX - textW, legendY)
    // colored square
    const r = parseInt(emp.color.slice(1, 3), 16)
    const g = parseInt(emp.color.slice(3, 5), 16)
    const b = parseInt(emp.color.slice(5, 7), 16)
    doc.setFillColor(r, g, b)
    doc.rect(legendX - textW - 3.5, legendY - 2.5, 2.5, 2.5, 'F')
    legendX = legendX - textW - 6
  })

  // Table
  const tableTop = legendY + 4
  const tableBottom = pageH - 8 - 8 // footer
  const tableH = tableBottom - tableTop
  const colCount = 6
  const availW = pageW - 2 * margin
  const colW = availW / colCount
  const colHeaderH = 10
  const cellH = (tableH - colHeaderH) // total cell area

  // Column headers
  for (let c = 0; c < 6; c++) {
    const x = margin + c * colW
    const isAlt = c % 2 === 1
    doc.setFillColor(isAlt ? 45 : 38, isAlt ? 45 : 38, isAlt ? 45 : 38)
    doc.setFillColor(45, 45, 45)
    doc.rect(x, tableTop, colW, colHeaderH, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    const dayDate = addDays(monday, c)
    doc.text(DAY_NAMES[c].toUpperCase(), x + colW / 2, tableTop + 4.5, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(136, 136, 136)
    doc.text(formatDateShort(dayDate), x + colW / 2, tableTop + 8.5, { align: 'center' })
  }

  // Cell rows
  const subRowH = cellH / 3
  for (let c = 0; c < 6; c++) {
    const x = margin + c * colW
    const isSamedi = c === 5
    const isAlt = c % 2 === 1
    const bgR = isSamedi ? 245 : isAlt ? 249 : 255
    const bgG = isSamedi ? 245 : isAlt ? 249 : 255
    const bgB = isSamedi ? 245 : isAlt ? 249 : 255

    const dayPlan = planning[c]
    const vals = [dayPlan.M, dayPlan.N, dayPlan.W]

    for (let r = 0; r < 3; r++) {
      const y = tableTop + colHeaderH + r * subRowH
      const emp = EMPLOYEES[r]

      doc.setFillColor(bgR, bgG, bgB)
      doc.rect(x, y, colW, subRowH, 'F')

      // Border
      doc.setDrawColor(232, 232, 232)
      doc.setLineWidth(0.3)
      doc.rect(x, y, colW, subRowH, 'S')

      // Colored left border
      const lr = parseInt(emp.color.slice(1, 3), 16)
      const lg = parseInt(emp.color.slice(3, 5), 16)
      const lb = parseInt(emp.color.slice(5, 7), 16)
      doc.setFillColor(lr, lg, lb)
      doc.rect(x, y, 2.5, subRowH, 'F')

      // Content
      const text = vals[r]?.trim()
      const px = x + 5
      const py = y + subRowH / 2 + 1

      if (text) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(51, 51, 51)
        const initW = doc.getTextWidth(emp.initial + ' ')
        doc.text(emp.initial, px, py)
        doc.setFont('helvetica', 'normal')
        doc.text(text, px + initW, py)
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(180, 180, 180)
        doc.text('—', x + colW / 2, py, { align: 'center' })
      }
    }
  }

  // Outer table border
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.4)
  doc.rect(margin, tableTop, availW, colHeaderH + cellH, 'S')

  // Footer
  const footerY = pageH - 8
  doc.setDrawColor(224, 224, 224)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(136, 136, 136)
  doc.text(
    'Rosa Excavator | +596 696 34 31 21 | contact@rosaexcavator.com | SIRET: 952 827 186 00018',
    pageW / 2,
    footerY,
    { align: 'center' }
  )

  return doc.output('datauristring')
}

interface Props {
  clientSlug: string
  onClose: () => void
}

export default function WeeklyPlanningModal({ clientSlug, onClose }: Props) {
  const [monday, setMonday] = useState<Date>(() => getMondayOfWeek(new Date()))
  const [planning, setPlanning] = useState<WeekPlanning>(emptyWeek)
  const [generating, setGenerating] = useState(false)

  const saturday = addDays(monday, 5)

  function prevWeek() {
    setMonday((d) => addDays(d, -7))
  }
  function nextWeek() {
    setMonday((d) => addDays(d, 7))
  }

  function setValue(dayIdx: number, emp: 'M' | 'N' | 'W', val: string) {
    setPlanning((prev) => {
      const next = prev.map((d) => ({ ...d }))
      next[dayIdx][emp] = val
      return next
    })
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const pdfDataUri = await generatePDF(monday, planning)
      const base64 = pdfDataUri.split(',')[1]

      // Save to Supabase
      const supabase = createClient()
      const weekStart = monday.toISOString().split('T')[0]
      await supabase.from('plannings').upsert({
        client_slug: clientSlug,
        week_start: weekStart,
        planning_data: planning,
        pdf_base64: base64,
        created_at: new Date().toISOString(),
      }, { onConflict: 'client_slug,week_start' })

      // Download
      const link = document.createElement('a')
      link.href = pdfDataUri
      link.download = `planning-semaine-${weekStart}.pdf`
      link.click()

      toast.success('PDF généré et téléchargé !')
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de la génération du PDF')
    } finally {
      setGenerating(false)
    }
  }

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0F0F0F' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 flex-shrink-0"
        style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}
      >
        <h2 className="text-white font-bold text-base">Planning de la semaine</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Week selector */}
        <div className="flex items-center justify-center gap-4 px-4 py-4">
          <button onClick={prevWeek} style={{ color: '#C4607A' }}>
            <ChevronLeft size={22} />
          </button>
          <span className="text-white text-sm font-medium">
            Semaine du{' '}
            <span className="font-bold">{formatDate(monday, true)}</span>
            {' '}au{' '}
            <span className="font-bold">{formatDate(saturday, true)}</span>
          </span>
          <button onClick={nextWeek} style={{ color: '#C4607A' }}>
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Days */}
        <div className="px-4 flex flex-col gap-4">
          {DAY_NAMES.map((dayName, dayIdx) => {
            const dayDate = addDays(monday, dayIdx)
            const isSamedi = dayIdx === 5
            const dayPlan = planning[dayIdx]
            const empKeys: ('M' | 'N' | 'W')[] = ['M', 'N', 'W']

            return (
              <div
                key={dayIdx}
                className="rounded-xl overflow-hidden"
                style={{ opacity: isSamedi ? 0.7 : 1, border: '1px solid #2a2a2a' }}
              >
                {/* Day header */}
                <div
                  className="px-3 py-2 text-white font-bold text-xs tracking-wider"
                  style={{ borderBottom: '1px solid #2a2a2a', backgroundColor: '#161616' }}
                >
                  {dayName.toUpperCase()} {formatDateShort(dayDate)}
                </div>

                {/* Employee rows */}
                <div>
                  {EMPLOYEES.map((emp, eIdx) => (
                    <div
                      key={emp.initial}
                      className="flex items-center gap-3 px-3 py-2"
                      style={{
                        borderBottom: eIdx < 2 ? '1px solid #2a2a2a' : undefined,
                        backgroundColor: '#0F0F0F',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{ backgroundColor: emp.color }}
                      >
                        {emp.initial}
                      </div>
                      {/* Name */}
                      <span className="text-xs flex-shrink-0 w-28" style={{ color: '#999' }}>
                        {emp.name}
                      </span>
                      {/* Input */}
                      <input
                        type="text"
                        value={dayPlan[empKeys[eIdx]]}
                        onChange={(e) => setValue(dayIdx, empKeys[eIdx], e.target.value)}
                        placeholder="Chantier..."
                        className="flex-1 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                        style={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                        }}
                      />
                    </div>
                  ))}
                </div>
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
