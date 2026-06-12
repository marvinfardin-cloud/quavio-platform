'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, FileText, Download } from 'lucide-react'

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

export default function DevisHistoryPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const router = useRouter()
  const [devisList, setDevisList] = useState<DevisRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDevis() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('devis')
        .select('*')
        .eq('client_slug', clientSlug)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setDevisList(data)
      }
      setLoading(false)
    }
    fetchDevis()
  }, [clientSlug])

  function downloadPDF(row: DevisRow) {
    if (!row.pdf_data) return
    const link = document.createElement('a')
    link.href = row.pdf_data
    link.download = `devis-rosa-${row.client_name.replace(/\s+/g, '-').toLowerCase()}.pdf`
    link.click()
  }

  const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' €'
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0F0F0F', fontFamily: 'var(--font-space-grotesk)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 px-8 py-5 border-b"
        style={{ backgroundColor: '#0A0A0A', borderColor: '#1a1a1a' }}
      >
        <button
          onClick={() => router.push(`/${clientSlug}/dashboard`)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <FileText size={20} style={{ color: '#C4607A' }} />
          <h1 className="text-white font-bold text-lg">Historique des devis</h1>
        </div>
      </div>

      <div className="px-8 py-8 max-w-5xl mx-auto">
        {loading ? (
          <p className="text-zinc-500 text-sm">Chargement...</p>
        ) : devisList.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto mb-4" style={{ color: '#333' }} />
            <p className="text-zinc-500">Aucun devis généré pour l&apos;instant.</p>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden border"
            style={{ borderColor: '#1a1a1a' }}
          >
            {/* Table header */}
            <div
              className="grid text-xs uppercase tracking-wider font-semibold px-5 py-3"
              style={{
                backgroundColor: '#161616',
                color: '#555',
                gridTemplateColumns: '140px 1fr 110px 120px 48px',
              }}
            >
              <span>N° Devis</span>
              <span>Client</span>
              <span>Date</span>
              <span className="text-right">Total TTC</span>
              <span />
            </div>

            {devisList.map((row, i) => (
              <div
                key={row.id}
                className="grid items-center px-5 py-4 border-t"
                style={{
                  gridTemplateColumns: '140px 1fr 110px 120px 48px',
                  borderColor: '#1a1a1a',
                  backgroundColor: i % 2 === 0 ? '#111' : '#0F0F0F',
                }}
              >
                <span className="text-zinc-300 text-sm font-mono">{row.devis_number}</span>
                <div>
                  <p className="text-white text-sm font-medium">{row.client_name}</p>
                  {row.client_address && (
                    <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-xs">{row.client_address}</p>
                  )}
                </div>
                <span className="text-zinc-400 text-sm">{fmtDate(row.created_at)}</span>
                <span className="text-right font-bold" style={{ color: '#C4607A' }}>
                  {fmt(row.total_ttc)}
                </span>
                <button
                  onClick={() => downloadPDF(row)}
                  disabled={!row.pdf_data}
                  className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors disabled:opacity-30"
                  style={{ backgroundColor: '#1a1a1a' }}
                  title="Télécharger le PDF"
                >
                  <Download size={15} className="text-zinc-300" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
