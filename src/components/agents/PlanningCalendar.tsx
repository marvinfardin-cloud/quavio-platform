'use client'

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
  // ── Weekly landscape PDF (pure jsPDF draw) ──
  const exportWeeklyPDF = async () => {
    const { default: jsPDF } = await import('jspdf')

    const W = 297
    const H = 210
    const margin = 8
    const cols = 7
    const colW = (W - margin * 2) / cols

    const pdf = new jsPDF('landscape', 'mm', 'a4')

    // Full dark background
    pdf.setFillColor(10, 10, 10)
    pdf.rect(0, 0, W, H, 'F')

    // Logo (attempt)
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = window.location.origin + '/agents/rosa_logo.png'
      await new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r() })
      if (img.naturalWidth > 0) {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        c.getContext('2d')!.drawImage(img, 0, 0)
        pdf.addImage(c.toDataURL('image/png'), 'PNG', margin, 4, 16, 16)
      }
    } catch { /* logo is optional */ }

    // Header text
    pdf.setFontSize(13)
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.text('PLANNING SEMAINE', W / 2, 12, { align: 'center' })

    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.setFont('helvetica', 'normal')
    pdf.text(data.semaine, W - margin, 12, { align: 'right' })

    const headerTop = 20
    const headerH = 12
    const bodyTop = headerTop + headerH
    const bodyH = H - bodyTop - 16
    const rowH = bodyH / 3

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    const employees: { name: string; color: [number, number, number] }[] = [
      { name: 'Marcus Mathurin', color: [74, 144, 217] },
      { name: 'Nicky Antoine', color: [39, 174, 96] },
      { name: 'William Joseph-Julien', color: [230, 126, 34] },
    ]

    // Column headers
    days.forEach((day, i) => {
      const x = margin + i * colW
      pdf.setFillColor(30, 30, 30)
      pdf.roundedRect(x + 0.5, headerTop, colW - 1, headerH, 1.5, 1.5, 'F')

      pdf.setFontSize(8)
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.text(day, x + colW / 2, headerTop + 5, { align: 'center' })

      const dayData = data.planning.find(d => d.jour === day)
      if (dayData?.date) {
        const dateStr = new Date(dayData.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        pdf.setFontSize(6.5)
        pdf.setTextColor(120, 120, 120)
        pdf.setFont('helvetica', 'normal')
        pdf.text(dateStr, x + colW / 2, headerTop + 9.5, { align: 'center' })
      }
    })

    // Employee rows
    employees.forEach((emp, empIdx) => {
      const rowTop = bodyTop + empIdx * rowH
      const bg = empIdx % 2 === 0 ? 18 : 22

      pdf.setFillColor(bg, bg, bg)
      pdf.rect(margin, rowTop, W - margin * 2, rowH, 'F')

      // Color accent bar on left edge
      pdf.setFillColor(...emp.color)
      pdf.rect(margin, rowTop, 2, rowH, 'F')

      const firstName = emp.name.split(' ')[0]

      days.forEach((day, dayIdx) => {
        const x = margin + dayIdx * colW
        const dayData = data.planning.find(d => d.jour === day)
        const assignation = dayData?.assignations?.find(a => a.employe === emp.name)

        // Cell border
        pdf.setDrawColor(40, 40, 40)
        pdf.setLineWidth(0.3)
        pdf.rect(x + 0.5, rowTop + 0.5, colW - 1, rowH - 1)

        if (assignation) {
          pdf.setFontSize(7)
          pdf.setTextColor(...emp.color)
          pdf.setFont('helvetica', 'bold')
          pdf.text(firstName, x + 3, rowTop + 6)

          pdf.setFontSize(6.5)
          pdf.setTextColor(200, 200, 200)
          pdf.setFont('helvetica', 'normal')
          const lines = pdf.splitTextToSize(assignation.tache, colW - 5)
          const maxLines = Math.floor((rowH - 10) / 4)
          ;(lines as string[]).slice(0, maxLines).forEach((line, li) => {
            pdf.text(line, x + 3, rowTop + 12 + li * 4)
          })
        } else {
          pdf.setFontSize(8)
          pdf.setTextColor(50, 50, 50)
          pdf.text('—', x + colW / 2, rowTop + rowH / 2, { align: 'center' })
        }
      })
    })

    // Legend
    const legendY = H - 8
    const legendStartX = W / 2 - 55
    employees.forEach((emp, i) => {
      const lx = legendStartX + i * 40
      pdf.setFillColor(...emp.color)
      pdf.circle(lx, legendY - 1.5, 1.5, 'F')
      pdf.setFontSize(7)
      pdf.setTextColor(150, 150, 150)
      pdf.setFont('helvetica', 'normal')
      pdf.text(emp.name, lx + 4, legendY)
    })

    // Footer
    pdf.setFontSize(6)
    pdf.setTextColor(80, 80, 80)
    pdf.text('Rosa Excavator | contact@rosaexcavator.com | SIRET : 952 827 186 00018', W / 2, H - 3, { align: 'center' })

    pdf.save(`planning-semaine-${Date.now()}.pdf`)
  }

  // ── Employee detail portrait PDF (pure jsPDF draw) ────────────
  const exportEmployeePDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF('portrait', 'mm', 'a4')
    const pageW = 210, pageH = 297

    pdf.setFillColor(10, 10, 10)
    pdf.rect(0, 0, pageW, pageH, 'F')

    pdf.setFontSize(14)
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.text('DÉTAIL PAR EMPLOYÉ', pageW / 2, 18, { align: 'center' })

    pdf.setFontSize(9)
    pdf.setTextColor(160, 160, 160)
    pdf.setFont('helvetica', 'normal')
    pdf.text(data.semaine, pageW / 2, 25, { align: 'center' })

    const employees: { name: string; color: [number, number, number] }[] = [
      { name: 'Marcus Mathurin', color: [74, 144, 217] },
      { name: 'Nicky Antoine', color: [39, 174, 96] },
      { name: 'William Joseph-Julien', color: [230, 126, 34] },
    ]

    let currentY = 35

    employees.forEach((emp) => {
      const empAssignations = data.planning.filter(d =>
        d.assignations?.some(a => a.employe === emp.name)
      )

      if (empAssignations.length === 0) return

      // Estimate height: header 12mm + each day ~10mm + gap 8mm
      const neededHeight = 12 + empAssignations.length * 10 + 8

      if (currentY + neededHeight > pageH - 15) {
        pdf.addPage()
        pdf.setFillColor(10, 10, 10)
        pdf.rect(0, 0, pageW, pageH, 'F')
        currentY = 15
      }

      // Employee header bar
      pdf.setFillColor(...emp.color)
      pdf.rect(15, currentY, 180, 10, 'F')
      pdf.setFontSize(10)
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.text(emp.name, 18, currentY + 7)
      currentY += 14

      // Days with tasks only
      empAssignations.forEach((dayData) => {
        const assignation = dayData.assignations.find(a => a.employe === emp.name)
        if (!assignation) return

        const raw = dayData.date
          ? new Date(dayData.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
          : dayData.jour
        const dateLabel = raw.charAt(0).toUpperCase() + raw.slice(1)

        pdf.setFontSize(8)
        pdf.setTextColor(255, 255, 255)
        pdf.setFont('helvetica', 'bold')
        pdf.text(dateLabel, 18, currentY)

        pdf.setFontSize(8)
        pdf.setTextColor(180, 180, 180)
        pdf.setFont('helvetica', 'normal')
        const lines = pdf.splitTextToSize(assignation.tache, 174) as string[]
        lines.forEach((line, li) => {
          pdf.text(line, 18, currentY + 4 + li * 4)
        })

        currentY += 6 + lines.length * 4
      })

      currentY += 8

      // Separator
      pdf.setDrawColor(50, 50, 50)
      pdf.setLineWidth(0.3)
      pdf.line(15, currentY - 4, 195, currentY - 4)
    })

    // Footer on last page
    pdf.setFontSize(6)
    pdf.setTextColor(80, 80, 80)
    pdf.setFont('helvetica', 'normal')
    pdf.text(
      'Rosa Excavator | contact@rosaexcavator.com | SIRET : 952 827 186 00018',
      105, pageH - 5, { align: 'center' }
    )

    pdf.save(`planning-employes-${Date.now()}.pdf`)
  }

  return (
    <div className="pb-4">
      {/* ── Visible calendar (responsive, mobile-first) ─────────── */}
      <div className="w-full overflow-x-auto rounded-xl p-3" style={{ backgroundColor: '#0A0A0A' }}>
        <CalendarGrid data={data} large={false} />
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
