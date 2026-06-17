'use client'

import { useRef } from 'react'

interface Assignation {
  employe: string
  tache: string
}

interface DayPlan {
  jour: string
  date: string
  assignations: Assignation[]
}

interface PlanningCalendarProps {
  data: {
    semaine: string
    planning: DayPlan[]
  }
}

const EMPLOYEE_COLORS: Record<string, string> = {
  'Marcus Mathurin': '#4A90D9',
  'Nicky Antoine': '#27AE60',
  'William Joseph-Julien': '#E67E22',
}

const EMPLOYEES = ['Marcus Mathurin', 'Nicky Antoine', 'William Joseph-Julien']

export default function PlanningCalendar({ data }: PlanningCalendarProps) {
  const calendarRef = useRef<HTMLDivElement>(null)

  const exportPDF = async () => {
    if (!calendarRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const { default: jsPDF } = await import('jspdf')
    const canvas = await html2canvas(calendarRef.current, {
      backgroundColor: '#0A0A0A',
      scale: 2,
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('landscape', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`planning-rosa-${Date.now()}.pdf`)
  }

  return (
    <div className="px-4 pb-4">
      <div
        ref={calendarRef}
        className="rounded-xl p-4"
        style={{ backgroundColor: '#0A0A0A', border: '1px solid #1a1a1a' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/agents/rosa_logo.png" alt="Rosa" style={{ height: 36, objectFit: 'contain', background: 'white', borderRadius: '50%', padding: 2 }} />
          <span className="text-white font-bold text-base">PLANNING SEMAINE</span>
          <span className="text-zinc-400 text-sm">{data.semaine}</span>
        </div>

        {/* Calendar grid */}
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {data.planning.map((day) => {
            const dateLabel = day.date
              ? new Date(day.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              : ''
            return (
              <div key={day.jour}>
                {/* Column header */}
                <div
                  className="text-center py-2 px-1 rounded-t-lg"
                  style={{ backgroundColor: '#1E1E1E' }}
                >
                  <div className="text-white font-semibold text-xs leading-tight">{day.jour}</div>
                  {dateLabel && (
                    <div className="text-zinc-500 text-[10px] mt-0.5">{dateLabel}</div>
                  )}
                </div>
                {/* Cell */}
                <div
                  className="rounded-b-lg p-1.5"
                  style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', minHeight: 100 }}
                >
                  {day.assignations.length === 0 ? (
                    <div className="h-full" />
                  ) : (
                    day.assignations.map((a, i) => {
                      const color = EMPLOYEE_COLORS[a.employe] ?? '#888'
                      return (
                        <div
                          key={i}
                          className="mb-1 rounded-r-md px-1.5 py-1"
                          style={{
                            borderLeft: `3px solid ${color}`,
                            backgroundColor: '#111',
                          }}
                        >
                          <div className="font-bold text-[10px] leading-tight" style={{ color }}>
                            {a.employe.split(' ')[0]}
                          </div>
                          <div className="text-zinc-300 text-[10px] mt-0.5 leading-tight">{a.tache}</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-6 mt-4 justify-center flex-wrap">
          {EMPLOYEES.map(emp => (
            <div key={emp} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EMPLOYEE_COLORS[emp] }} />
              <span className="text-zinc-400 text-sm">{emp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Export button — outside calendarRef so it doesn't appear in PDF */}
      <button
        onClick={exportPDF}
        className="block mx-auto mt-3 px-5 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#C4607A' }}
      >
        Exporter en PDF
      </button>
    </div>
  )
}
