'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, FileText, Download, CalendarDays } from 'lucide-react'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'

interface DevisRow {
  id: string
  devis_number: string
  client_name: string
  client_address: string | null
  total_ht: number
  tva: number
  total_ttc: number
  pdf_data: string | null
  created_at: string
}

interface PlanningRow {
  id: string
  month: number
  year: number
  pdf_base64: string | null
  created_at: string
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export default function DevisHistoryPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const router = useRouter()
  const [devisList, setDevisList] = useState<DevisRow[]>([])
  const [planningsList, setPlanningsList] = useState<PlanningRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'devis' | 'plannings'>('devis')

  useEffect(() => {
    async function fetchAll() {
      const supabase = createClient()
      const [devisRes, planningsRes] = await Promise.all([
        supabase.from('devis').select('*').eq('client_slug', clientSlug).order('created_at', { ascending: false }),
        supabase.from('plannings').select('id, month, year, pdf_base64, created_at').eq('client_slug', clientSlug).order('created_at', { ascending: false }),
      ])
      if (!devisRes.error && devisRes.data) setDevisList(devisRes.data)
      if (!planningsRes.error && planningsRes.data) setPlanningsList(planningsRes.data)
      setLoading(false)
    }
    fetchAll()
  }, [clientSlug])

  function downloadDevisPDF(row: DevisRow) {
    if (!row.pdf_data) return
    const link = document.createElement('a')
    link.href = row.pdf_data
    link.download = `devis-rosa-${row.client_name.replace(/\s+/g, '-').toLowerCase()}.pdf`
    link.click()
  }

  function downloadPlanningPDF(row: PlanningRow) {
    if (!row.pdf_base64) return
    const link = document.createElement('a')
    link.href = row.pdf_base64
    link.download = `planning-${MONTHS_FR[row.month].toLowerCase()}-${row.year}.pdf`
    link.click()
  }

  const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' €'
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0F0F0F', fontFamily: 'var(--font-space-grotesk)' }}>
      <div className="hidden lg:block">
        <Sidebar clientSlug={clientSlug} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 lg:px-8 py-4 border-b flex-shrink-0"
          style={{ backgroundColor: '#0A0A0A', borderColor: '#1a1a1a', paddingTop: 'max(16px, env(safe-area-inset-top))' }}
        >
          <button
            onClick={() => router.push(`/${clientSlug}/dashboard`)}
            className="text-zinc-400 hover:text-white p-1 -ml-1 min-h-[44px] flex items-center"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <FileText size={18} style={{ color: '#C4607A' }} />
            <h1 className="text-white font-bold text-base lg:text-lg">Documents</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ backgroundColor: '#0A0A0A', borderColor: '#1a1a1a' }}>
          {([['devis', 'Devis', FileText], ['plannings', 'Plannings', CalendarDays]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors"
              style={{
                color: tab === id ? '#C4607A' : '#666',
                borderBottom: tab === id ? '2px solid #C4607A' : '2px solid transparent',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-4 lg:px-8 py-4 lg:py-8 pb-24 lg:pb-8">
          {loading ? (
            <p className="text-zinc-500 text-sm">Chargement...</p>
          ) : tab === 'devis' ? (
            devisList.length === 0 ? (
              <EmptyState icon={FileText} text="Aucun devis généré pour l'instant." />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="space-y-3 lg:hidden">
                  {devisList.map((row) => (
                    <div key={row.id} className="rounded-xl p-4" style={{ backgroundColor: '#111', border: '1px solid #1a1a1a' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-semibold text-sm">{row.client_name}</p>
                          {row.client_address && (
                            <p className="text-zinc-500 text-xs mt-0.5 truncate">{row.client_address}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-zinc-500 text-xs font-mono">{row.devis_number}</span>
                            <span className="text-zinc-500 text-xs">{fmtDate(row.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="font-bold text-sm" style={{ color: '#C4607A' }}>{fmt(row.total_ttc)}</span>
                          <button
                            onClick={() => downloadDevisPDF(row)}
                            disabled={!row.pdf_data}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-30 min-h-[44px]"
                            style={{ backgroundColor: '#1a1a1a' }}
                          >
                            <Download size={13} />PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block rounded-2xl overflow-hidden border max-w-5xl" style={{ borderColor: '#1a1a1a' }}>
                  <div className="grid text-xs uppercase tracking-wider font-semibold px-5 py-3" style={{ backgroundColor: '#161616', color: '#555', gridTemplateColumns: '140px 1fr 110px 120px 48px' }}>
                    <span>N° Devis</span><span>Client</span><span>Date</span><span className="text-right">Total TTC</span><span />
                  </div>
                  {devisList.map((row, i) => (
                    <div key={row.id} className="grid items-center px-5 py-4 border-t" style={{ gridTemplateColumns: '140px 1fr 110px 120px 48px', borderColor: '#1a1a1a', backgroundColor: i % 2 === 0 ? '#111' : '#0F0F0F' }}>
                      <span className="text-zinc-300 text-sm font-mono">{row.devis_number}</span>
                      <div>
                        <p className="text-white text-sm font-medium">{row.client_name}</p>
                        {row.client_address && <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-xs">{row.client_address}</p>}
                      </div>
                      <span className="text-zinc-400 text-sm">{fmtDate(row.created_at)}</span>
                      <span className="text-right font-bold" style={{ color: '#C4607A' }}>{fmt(row.total_ttc)}</span>
                      <button onClick={() => downloadDevisPDF(row)} disabled={!row.pdf_data} className="flex items-center justify-center w-9 h-9 rounded-lg disabled:opacity-30" style={{ backgroundColor: '#1a1a1a' }} title="Télécharger">
                        <Download size={15} className="text-zinc-300" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            planningsList.length === 0 ? (
              <EmptyState icon={CalendarDays} text="Aucun planning généré pour l'instant." />
            ) : (
              <div className="space-y-3 max-w-2xl">
                {planningsList.map((row) => (
                  <div key={row.id} className="flex items-center justify-between rounded-xl px-4 py-4" style={{ backgroundColor: '#111', border: '1px solid #1a1a1a' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1a1a1a' }}>
                        <CalendarDays size={18} style={{ color: '#C4607A' }} />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{MONTHS_FR[row.month]} {row.year}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{fmtDate(row.created_at)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadPlanningPDF(row)}
                      disabled={!row.pdf_base64}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-30 min-h-[44px]"
                      style={{ backgroundColor: '#1a1a1a' }}
                    >
                      <Download size={14} />
                      PDF
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <BottomNav clientSlug={clientSlug} />
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center py-16">
      <Icon size={40} className="mx-auto mb-4" style={{ color: '#333' }} />
      <p className="text-zinc-500">{text}</p>
    </div>
  )
}
