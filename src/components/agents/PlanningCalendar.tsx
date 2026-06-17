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
    const { default: jsPDF } = await import('jspdf')

    const pdf = new jsPDF('landscape', 'mm', 'a4')
    const pageW = 297
    const pageH = 210
    const margin = 10
    const colCount = 7
    const colW = (pageW - margin * 2) / colCount

    // Background
    pdf.setFillColor(10, 10, 10)
    pdf.rect(0, 0, pageW, pageH, 'F')

    // Header title
    pdf.setFontSize(16)
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.text('PLANNING SEMAINE', pageW / 2, 18, { align: 'center' })

    // Semaine range
    pdf.setFontSize(9)
    pdf.setTextColor(160, 160, 160)
    pdf.setFont('helvetica', 'normal')
    pdf.text(data.semaine, pageW - margin, 18, { align: 'right' })

    // Logo
    try {
      const logoImg = new Image()
      logoImg.src = '/agents/rosa_logo.png'
      await new Promise<void>((resolve) => {
        logoImg.onload = () => resolve()
        logoImg.onerror = () => resolve()
      })
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const canvas = document.createElement('canvas')
        canvas.width = logoImg.naturalWidth
        canvas.height = logoImg.naturalHeight
        canvas.getContext('2d')!.drawImage(logoImg, 0, 0)
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, 8, 18, 18)
      }
    } catch {}

    const headerY = 28
    const rowH = pageH - headerY - margin - 12

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    const employeeColors: Record<string, [number, number, number]> = {
      'Marcus Mathurin': [74, 144, 217],
      'Nicky Antoine': [39, 174, 96],
      'William Joseph-Julien': [230, 126, 34],
    }

    days.forEach((day, i) => {
      const x = margin + i * colW
      const dayData = data.planning.find(d => d.jour === day)

      // Column header
      pdf.setFillColor(30, 30, 30)
      pdf.roundedRect(x + 1, headerY, colW - 2, 14, 2, 2, 'F')

      pdf.setFontSize(9)
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.text(day, x + colW / 2, headerY + 6, { align: 'center' })

      if (dayData?.date) {
        const dateStr = new Date(dayData.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        pdf.setFontSize(7)
        pdf.setTextColor(120, 120, 120)
        pdf.setFont('helvetica', 'normal')
        pdf.text(dateStr, x + colW / 2, headerY + 11, { align: 'center' })
      }

      // Cell background
      pdf.setFillColor(26, 26, 26)
      pdf.roundedRect(x + 1, headerY + 15, colW - 2, rowH - 15, 2, 2, 'F')

      // Assignations
      let cellY = headerY + 20
      const cellPadding = 3

      dayData?.assignations?.forEach((a) => {
        const color = employeeColors[a.employe] ?? [150, 150, 150]
        const firstName = a.employe.split(' ')[0]

        pdf.setFillColor(17, 17, 17)
        pdf.roundedRect(x + 2, cellY, colW - 4, 18, 1, 1, 'F')

        pdf.setFillColor(...color)
        pdf.rect(x + 2, cellY, 2, 18, 'F')

        pdf.setFontSize(7)
        pdf.setTextColor(...color)
        pdf.setFont('helvetica', 'bold')
        pdf.text(firstName, x + 6, cellY + 6)

        pdf.setFontSize(6.5)
        pdf.setTextColor(200, 200, 200)
        pdf.setFont('helvetica', 'normal')
        const lines = pdf.splitTextToSize(a.tache, colW - 10)
        lines.slice(0, 2).forEach((line: string, li: number) => {
          pdf.text(line, x + 6, cellY + 11 + li * 4)
        })

        cellY += 22 + cellPadding
      })
    })

    // Legend
    const legendY = pageH - 8
    const legendItems: { name: string; color: [number, number, number] }[] = [
      { name: 'Marcus Mathurin', color: [74, 144, 217] },
      { name: 'Nicky Antoine', color: [39, 174, 96] },
      { name: 'William Joseph-Julien', color: [230, 126, 34] },
    ]
    const legendStartX = pageW / 2 - 60
    legendItems.forEach((item, i) => {
      const lx = legendStartX + i * 45
      pdf.setFillColor(...item.color)
      pdf.circle(lx, legendY - 1, 1.5, 'F')
      pdf.setFontSize(7)
      pdf.setTextColor(160, 160, 160)
      pdf.setFont('helvetica', 'normal')
      pdf.text(item.name, lx + 4, legendY)
    })

    // ── Page 2: Portrait — detail per employee ───────────────────
    pdf.addPage('a4', 'portrait')
    const p2W = 210
    const p2H = 297
    const p2M = 15

    pdf.setFillColor(10, 10, 10)
    pdf.rect(0, 0, p2W, p2H, 'F')

    pdf.setFontSize(14)
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.text('DÉTAIL PAR EMPLOYÉ', p2W / 2, 20, { align: 'center' })

    pdf.setFontSize(9)
    pdf.setTextColor(160, 160, 160)
    pdf.setFont('helvetica', 'normal')
    pdf.text(data.semaine, p2W / 2, 28, { align: 'center' })

    const p2Employees: { name: string; color: [number, number, number] }[] = [
      { name: 'Marcus Mathurin', color: [74, 144, 217] },
      { name: 'Nicky Antoine', color: [39, 174, 96] },
      { name: 'William Joseph-Julien', color: [230, 126, 34] },
    ]

    let p2Y = 38

    p2Employees.forEach((emp, ei) => {
      // Employee header band
      pdf.setFillColor(...emp.color)
      pdf.rect(p2M, p2Y, p2W - p2M * 2, 10, 'F')
      pdf.setFontSize(11)
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.text(emp.name, p2M + 4, p2Y + 7)
      p2Y += 13

      // Days with this employee
      const daysForEmp = data.planning.filter(d =>
        d.assignations.some(a => a.employe === emp.name)
      )

      if (daysForEmp.length === 0) {
        pdf.setFontSize(9)
        pdf.setTextColor(100, 100, 100)
        pdf.setFont('helvetica', 'italic')
        pdf.text('Aucune assignation cette semaine', p2M + 4, p2Y + 5)
        p2Y += 10
      } else {
        daysForEmp.forEach((day) => {
          const tache = day.assignations.find(a => a.employe === emp.name)?.tache ?? ''
          const dateLabel = day.date
            ? new Date(day.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
            : ''

          // Day label
          pdf.setFontSize(9)
          pdf.setTextColor(255, 255, 255)
          pdf.setFont('helvetica', 'bold')
          pdf.text(`${day.jour}${dateLabel ? ` ${dateLabel}` : ''}`, p2M + 4, p2Y + 5)

          // Task text (wrapped)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(180, 180, 180)
          const wrappedLines = pdf.splitTextToSize(tache, p2W - p2M * 2 - 8)
          wrappedLines.forEach((line: string, li: number) => {
            pdf.text(line, p2M + 4, p2Y + 11 + li * 5)
          })
          p2Y += 10 + wrappedLines.length * 5 + 3
        })
      }

      // Separator between employees (not after last)
      if (ei < p2Employees.length - 1) {
        pdf.setDrawColor(40, 40, 40)
        pdf.line(p2M, p2Y + 2, p2W - p2M, p2Y + 2)
        p2Y += 10
      }
    })

    pdf.save(`planning-rosa-${Date.now()}.pdf`)
  }

  return (
    <div className="px-4 pb-4">
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
                <div
                  style={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '0 0 8px 8px',
                    minHeight: 180,
                    padding: 14,
                  }}
                >
                  {day.assignations.map((a, idx) => {
                    const color = EMPLOYEE_COLORS[a.employe] ?? '#888'
                    return (
                      <div
                        key={idx}
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

      {/* Export button — outside calendarRef, not captured in PDF */}
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
