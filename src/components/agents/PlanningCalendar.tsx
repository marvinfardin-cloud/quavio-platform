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
      useCORS: true,
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('landscape', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight)
    pdf.save(`planning-rosa-${Date.now()}.pdf`)
  }

  return (
    <div className="px-4 pb-4">
      {/* Fixed-size 1123px container = A4 landscape at 96dpi — html2canvas captures this */}
      <div
        ref={calendarRef}
        className="rounded-xl"
        style={{
          backgroundColor: '#0A0A0A',
          border: '1px solid #1a1a1a',
          width: '1123px',
          padding: '32px',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/agents/rosa_logo.png"
            alt="Rosa"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            style={{ height: 44, objectFit: 'contain', background: 'white', borderRadius: '50%', padding: 3 }}
          />
          <span style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>PLANNING SEMAINE</span>
          <span style={{ color: '#a1a1aa', fontSize: 13 }}>{data.semaine}</span>
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {data.planning.map((day) => {
            const dateLabel = day.date
              ? new Date(day.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              : ''
            return (
              <div key={day.jour}>
                {/* Column header */}
                <div
                  style={{
                    backgroundColor: '#1E1E1E',
                    padding: '14px 8px',
                    borderRadius: '8px 8px 0 0',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{day.jour}</div>
                  {dateLabel && (
                    <div style={{ color: '#71717a', fontSize: 12, marginTop: 4 }}>{dateLabel}</div>
                  )}
                </div>
                {/* Cell */}
                <div
                  style={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '0 0 8px 8px',
                    minHeight: 180,
                    padding: 14,
                  }}
                >
                  {day.assignations.map((a, i) => {
                    const color = EMPLOYEE_COLORS[a.employe] ?? '#888'
                    return (
                      <div
                        key={i}
                        style={{
                          borderLeft: `4px solid ${color}`,
                          backgroundColor: '#111',
                          padding: '10px 12px',
                          marginBottom: 12,
                          borderRadius: '0 6px 6px 0',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                        }}
                      >
                        <div style={{ color, fontSize: 13, fontWeight: 'bold', lineHeight: 1.3 }}>
                          {a.employe.split(' ')[0]}
                        </div>
                        <div style={{ color: '#d4d4d8', fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>
                          {a.tache}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 32, marginTop: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {EMPLOYEES.map(emp => (
            <div key={emp} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: EMPLOYEE_COLORS[emp], flexShrink: 0 }} />
              <span style={{ color: '#a1a1aa', fontSize: 13 }}>{emp}</span>
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
