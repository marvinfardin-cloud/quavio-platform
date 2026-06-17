'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import PlanningCalendar from '@/components/agents/PlanningCalendar'
import BottomNav from '@/components/dashboard/BottomNav'
import Sidebar from '@/components/dashboard/Sidebar'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const EMPLOYEES = ['Marcus Mathurin', 'Nicky Antoine', 'William Joseph-Julien']
const EMPLOYEE_COLORS = ['#4A90D9', '#27AE60', '#E67E22']

interface PlanningData {
  semaine: string
  planning: {
    jour: string
    date: string
    assignations: { employe: string; tache: string }[]
  }[]
}

function formatDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export default function PlanningPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  // tasks[empIdx][dayIdx]
  const [tasks, setTasks] = useState<string[][]>(
    Array.from({ length: 3 }, () => Array(7).fill(''))
  )
  const [expanded, setExpanded] = useState([true, true, true])
  const [planningData, setPlanningData] = useState<PlanningData | null>(null)
  const planningRef = useRef<HTMLDivElement>(null)

  function handleStartDate(val: string) {
    setStartDate(val)
    if (val) {
      const end = addDays(new Date(val + 'T12:00:00'), 6)
      setEndDate(end.toISOString().split('T')[0])
    } else {
      setEndDate('')
    }
  }

  function setTask(empIdx: number, dayIdx: number, val: string) {
    setTasks(prev => {
      const next = prev.map(row => [...row])
      next[empIdx][dayIdx] = val
      return next
    })
  }

  function toggleExpanded(i: number) {
    setExpanded(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  function getDayDate(dayIdx: number): string {
    if (!startDate) return ''
    const d = addDays(new Date(startDate + 'T12:00:00'), dayIdx)
    return formatDate(d)
  }

  function generate() {
    if (!startDate) return
    const start = new Date(startDate + 'T12:00:00')
    const end = new Date(endDate + 'T12:00:00')

    const fmtShort = (d: Date) =>
      d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

    const data: PlanningData = {
      semaine: `du ${fmtShort(start)} au ${fmtShort(end)}`,
      planning: DAYS.map((jour, dayIdx) => {
        const date = addDays(start, dayIdx)
        return {
          jour,
          date: date.toISOString().split('T')[0],
          assignations: EMPLOYEES
            .map((employe, empIdx) => ({ employe, tache: tasks[empIdx][dayIdx].trim() }))
            .filter(a => a.tache.length > 0),
        }
      }),
    }

    setPlanningData(data)
    setTimeout(() => planningRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0A0A0A', fontFamily: 'var(--font-space-grotesk)' }}>
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar clientSlug={clientSlug} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: '#1a1a1a', paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          <Link
            href={`/${clientSlug}/dashboard`}
            className="text-zinc-400 hover:text-white p-1 -ml-1 min-h-[44px] flex items-center"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-white font-bold text-base">Planning Hebdomadaire</h1>
            <p className="text-zinc-500 text-sm">Rosa Excavator</p>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 pb-24 lg:pb-8 max-w-2xl w-full mx-auto"
        >
          {/* Week date range */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5">Du</label>
              <input
                type="date"
                value={startDate}
                onChange={e => handleStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-white outline-none"
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #2a2a2a',
                  fontSize: '16px',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs mb-1.5">Au</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-white outline-none"
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #2a2a2a',
                  fontSize: '16px',
                  colorScheme: 'dark',
                }}
              />
            </div>
          </div>

          {/* Employee sections */}
          <div className="space-y-3 mb-6">
            {EMPLOYEES.map((emp, empIdx) => (
              <div
                key={emp}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid #1a1a1a' }}
              >
                {/* Employee header */}
                <button
                  onClick={() => toggleExpanded(empIdx)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  style={{ backgroundColor: '#111' }}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: EMPLOYEE_COLORS[empIdx] }}
                  />
                  <span className="text-white font-semibold text-sm flex-1">{emp}</span>
                  {expanded[empIdx]
                    ? <ChevronUp size={16} className="text-zinc-500" />
                    : <ChevronDown size={16} className="text-zinc-500" />
                  }
                </button>

                {/* Day rows */}
                {expanded[empIdx] && (
                  <div className="divide-y divide-zinc-800">
                    {DAYS.map((day, dayIdx) => (
                      <div
                        key={day}
                        className="flex items-start gap-3 px-4 py-3"
                        style={{ backgroundColor: '#0d0d0d' }}
                      >
                        <div className="flex-shrink-0 w-28 pt-2">
                          <div className="text-zinc-300 text-xs font-semibold">{day}</div>
                          {getDayDate(dayIdx) && (
                            <div className="text-zinc-600 text-[10px] mt-0.5">{getDayDate(dayIdx)}</div>
                          )}
                        </div>
                        <textarea
                          value={tasks[empIdx][dayIdx]}
                          onChange={e => setTask(empIdx, dayIdx, e.target.value)}
                          placeholder="Tâche... (vide = repos)"
                          rows={2}
                          className="flex-1 px-3 py-2 rounded-lg text-white placeholder-zinc-700 text-sm outline-none resize-none"
                          style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            fontSize: '16px',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={!startDate}
            className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: '#C4607A' }}
          >
            Générer le Planning
          </button>

          {/* Calendar result */}
          {planningData && (
            <div ref={planningRef} className="mt-6">
              <PlanningCalendar data={planningData} />
            </div>
          )}
        </div>
      </div>

      <BottomNav clientSlug={clientSlug} />
    </div>
  )
}
