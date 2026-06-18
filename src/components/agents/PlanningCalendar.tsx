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

function CalendarGrid({ data, large }: { data: PlanningCalendarProps['data']; large?: boolean }) {
  return (
    <>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: large ? 20 : 10,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/agents/rosa_logo.png"
          alt="Rosa"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
          style={{
            height: large ? 40 : 24,
            objectFit: 'contain',
            background: 'white',
            borderRadius: '50%',
            padding: large ? 3 : 2,
          }}
        />
        <span
          style={{
            color: '#fff',
            fontSize: large ? 20 : 13,
            fontWeight: 'bold',
          }}
        >
          PLANNING SEMAINE
        </span>
        <span style={{ color: '#a1a1aa', fontSize: large ? 13 : 10 }}>{data.semaine}</span>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: large ? 8 : 4,
          minWidth: large ? undefined : 560,
        }}
      >
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
                  padding: large ? '12px 8px' : '8px 4px',
                  borderRadius: '6px 6px 0 0',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    color: '#fff',
                    fontSize: large ? 14 : 11,
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {day.jour}
                </div>
                {dateLabel && (
                  <div style={{ color: '#71717a', fontSize: large ? 11 : 9, marginTop: 2 }}>{dateLabel}</div>
                )}
              </div>
              {/* Cell */}
              <div
                style={{
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '0 0 6px 6px',
                  minHeight: large ? 200 : 90,
                  padding: large ? 12 : 6,
                }}
              >
                {day.assignations.map((a, idx) => {
                  const color = EMPLOYEE_COLORS[a.employe] ?? '#888'
                  return (
                    <div
                      key={idx}
                      style={{
                        borderLeft: `${large ? 3 : 2}px solid ${color}`,
                        backgroundColor: '#111',
                        padding: large ? '10px 12px' : '4px 6px',
                        marginBottom: large ? 8 : 4,
                        borderRadius: '0 4px 4px 0',
                        wordBreak: 'break-word',
                      }}
                    >
                      <div
                        style={{
                          color,
                          fontSize: large ? 13 : 10,
                          fontWeight: 'bold',
                          lineHeight: 1.2,
                        }}
                      >
                        {a.employe.split(' ')[0]}
                      </div>
                      <div
                        style={{
                          color: '#d4d4d8',
                          fontSize: large ? 12 : 10,
                          marginTop: large ? 3 : 1,
                          lineHeight: large ? 1.4 : 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: large ? 3 : 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
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
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: large ? 24 : 12,
          marginTop: large ? 16 : 8,
          justifyContent: 'center',
        }}
      >
        {EMPLOYEES.map((emp) => (
          <div key={emp} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: large ? 10 : 8,
                height: large ? 10 : 8,
                borderRadius: '50%',
                backgroundColor: EMPLOYEE_COLORS[emp],
                flexShrink: 0,
              }}
            />
            <span style={{ color: '#a1a1aa', fontSize: large ? 12 : 10 }}>{emp}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export default function PlanningCalendar({ data }: PlanningCalendarProps) {
  const calendarRef = useRef<HTMLDivElement>(null)

  // ── Weekly landscape PDF (html2canvas on hidden 1123px div) ──
  const exportWeeklyPDF = async () => {
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
    pdf.save(`planning-semaine-${Date.now()}.pdf`)
  }

  // ── Employee detail portrait PDF (pure jsPDF draw) ────────────
  const exportEmployeePDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF('portrait', 'mm', 'a4')
    const pW = 210, pH = 297, pM = 15

    pdf.setFillColor(10, 10, 10)
    pdf.rect(0, 0, pW, pH, 'F')

    pdf.setFontSize(14)
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.text('DÉTAIL PAR EMPLOYÉ', pW / 2, 18, { align: 'center' })

    pdf.setFontSize(9)
    pdf.setTextColor(160, 160, 160)
    pdf.setFont('helvetica', 'normal')
    pdf.text(data.semaine, pW / 2, 25, { align: 'center' })

    const employees: { name: string; color: [number, number, number] }[] = [
      { name: 'Marcus Mathurin', color: [74, 144, 217] },
      { name: 'Nicky Antoine', color: [39, 174, 96] },
      { name: 'William Joseph-Julien', color: [230, 126, 34] },
    ]

    let y = 34

    employees.forEach((emp, ei) => {
      pdf.setFillColor(...emp.color)
      pdf.rect(pM, y, pW - pM * 2, 10, 'F')
      pdf.setFontSize(10)
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.text(emp.name, pM + 4, y + 7)
      y += 13

      const daysForEmp = data.planning.filter(d =>
        d.assignations.some(a => a.employe === emp.name)
      )

      if (daysForEmp.length === 0) {
        pdf.setFontSize(8)
        pdf.setTextColor(100, 100, 100)
        pdf.setFont('helvetica', 'italic')
        pdf.text('Aucune assignation cette semaine', pM + 4, y + 4)
        y += 8
      } else {
        daysForEmp.forEach((day) => {
          const tache = day.assignations.find(a => a.employe === emp.name)?.tache ?? ''
          const dateLabel = day.date
            ? new Date(day.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
            : ''
          pdf.setFontSize(8)
          pdf.setTextColor(255, 255, 255)
          pdf.setFont('helvetica', 'bold')
          pdf.text(`${day.jour}${dateLabel ? ` ${dateLabel}` : ''}`, pM + 4, y + 4)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(180, 180, 180)
          const wrapped = pdf.splitTextToSize(tache, 180)
          wrapped.forEach((line: string, li: number) => {
            pdf.text(line, pM + 4, y + 9 + li * 5)
          })
          y += 8 + wrapped.length * 5 + 2
        })
      }

      if (ei < employees.length - 1) {
        pdf.setDrawColor(40, 40, 40)
        pdf.line(pM, y + 2, pW - pM, y + 2)
        y += 8
      }
    })

    pdf.setFontSize(7)
    pdf.setTextColor(100, 100, 100)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Rosa Excavator | contact@rosaexcavator.com', pW / 2, pH - 5, { align: 'center' })

    pdf.save(`planning-employes-${Date.now()}.pdf`)
  }

  return (
    <div className="pb-4">
      {/* ── Visible calendar (responsive, mobile-first) ─────────── */}
      <div className="w-full overflow-x-auto rounded-xl p-3" style={{ backgroundColor: '#0A0A0A' }}>
        <CalendarGrid data={data} large={false} />
      </div>

      {/* ── Hidden 1123px div for html2canvas capture ────────────── */}
      <div
        ref={calendarRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '1123px',
          backgroundColor: '#0A0A0A',
          padding: '32px',
          zIndex: -1,
        }}
      >
        <CalendarGrid data={data} large={true} />
      </div>

      {/* ── Export buttons ─────────────────────────────────────────── */}
      <div className="flex gap-3 justify-center mt-4">
        <button
          onClick={exportWeeklyPDF}
          className="px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#C4607A' }}
        >
          Planning complet
        </button>
        <button
          onClick={exportEmployeePDF}
          className="px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-80 transition-opacity bg-zinc-700"
        >
          Vue par employé
        </button>
      </div>
    </div>
  )
}
