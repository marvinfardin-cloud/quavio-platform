'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ClientConfig, Message } from '@/types'
import ChatMessage from '@/components/chat/ChatMessage'
import PlanningModal from '@/components/agents/PlanningModal'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, Copy, Check, FileDown, Mail, CalendarDays } from 'lucide-react'
import VoiceMicButton from '@/components/chat/VoiceMicButton'

const ZARA_PHOTO = '/agents/ZARA.JPEG'

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `Bonjour Rosa ! Je suis là pour vous aider dans votre quotidien.
Planning, messages clients, courriers, annonces...
Dites-moi ce dont vous avez besoin.`,
  timestamp: new Date().toISOString(),
}

type DocType = 'planning' | 'courrier' | 'annonce' | 'document' | null

interface ExtendedMessage extends Message {
  docType?: DocType
}

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch('/agents/rosa_logo.png')
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const DARK: [number, number, number] = [26, 26, 26]
const DARK2: [number, number, number] = [45, 45, 45]

function addPdfHeader(doc: import('jspdf').jsPDF, logoDataUrl: string | null, landscape: boolean, subtitle?: string) {
  const width = landscape ? 297 : 210
  doc.setFillColor(...DARK)
  doc.rect(0, 0, width, 40, 'F')
  if (logoDataUrl) {
    doc.setFillColor(255, 255, 255)
    doc.circle(21, 20, 12, 'F')
    doc.addImage(logoDataUrl, 'PNG', 9, 8, 24, 24)
  }
  const tx = logoDataUrl ? 40 : 15
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(subtitle ?? 'Rosa Excavator — Rental and Service', tx, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(180, 180, 180)
  doc.text(`Rosa Excavator  |  ${new Date().toLocaleDateString('fr-FR')}`, tx, 29)
}

function addPdfFooter(doc: import('jspdf').jsPDF, landscape: boolean) {
  const width = landscape ? 297 : 210
  const y = landscape ? 196 : 284
  doc.setDrawColor(224, 224, 224)
  doc.line(15, y - 2, width - 15, y - 2)
  doc.setTextColor(160, 160, 160)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('Rosa Excavator  |  +596 696 34 31 21  |  contact@rosaexcavator.com', width / 2, y + 5, { align: 'center' })
}

async function exportPlanningPDF(text: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape' })
  const logo = await loadLogo()

  // Extract week title from text if present
  const weekMatch = text.match(/PLANNING\s+SEMAINE\s+DU\s+[^\n]+/i)
  const subtitle = weekMatch ? weekMatch[0].trim() : 'PLANNING HEBDOMADAIRE'
  addPdfHeader(doc, logo, true, subtitle)

  const DAYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']
  const employees = ['MARCUS MATHURIN', 'NICKY ANTOINE', 'WILLIAM JOSEPH-JULIEN']

  const tableLeft = 15
  const tableTop = 48
  const colWidths = [32, 80, 80, 82]
  const tableWidth = colWidths.reduce((a, b) => a + b, 0)
  const rowH = 22
  const colStarts = [
    tableLeft,
    tableLeft + colWidths[0],
    tableLeft + colWidths[0] + colWidths[1],
    tableLeft + colWidths[0] + colWidths[1] + colWidths[2],
  ]

  // Header row
  doc.setFillColor(...DARK2)
  doc.rect(tableLeft, tableTop, tableWidth, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  const headers = ['JOUR', ...employees]
  headers.forEach((h, i) => {
    doc.text(h, colStarts[i] + 4, tableTop + 7)
  })

  // Parse lines into day buckets
  type DayData = { day: string; cells: string[] }
  const dayBuckets: DayData[] = []
  let current: DayData | null = null
  for (const line of text.split('\n')) {
    const upper = line.trim().toUpperCase()
    const foundDay = DAYS.find(d => upper.startsWith(d))
    if (foundDay) {
      if (current) dayBuckets.push(current)
      current = { day: line.trim(), cells: ['', '', ''] }
    } else if (current) {
      const empIdx = employees.findIndex(e => upper.includes(e) || upper.includes(e.split(' ')[0]))
      if (empIdx >= 0) {
        const colonIdx = line.indexOf(':')
        const val = colonIdx >= 0 ? line.slice(colonIdx + 1).trim() : line.trim()
        current.cells[empIdx] = (current.cells[empIdx] ? current.cells[empIdx] + ' ' : '') + val
      }
    }
  }
  if (current) dayBuckets.push(current)

  let y = tableTop + 10
  if (dayBuckets.length > 0) {
    dayBuckets.forEach((row, i) => {
      const bg: [number, number, number] = i % 2 === 0 ? [255, 255, 255] : [248, 248, 248]
      doc.setFillColor(...bg)
      doc.rect(tableLeft, y, tableWidth, rowH, 'F')
      doc.setDrawColor(224, 224, 224)
      doc.rect(tableLeft, y, tableWidth, rowH, 'S')

      // Day cell — bold dark
      doc.setTextColor(51, 51, 51)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.text(row.day.substring(0, 20), colStarts[0] + 4, y + 9)

      // Employee cells
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(26, 26, 26)
      row.cells.forEach((cell, ci) => {
        const wrapped = doc.splitTextToSize(cell, colWidths[ci + 1] - 8)
        doc.text(wrapped[0] ?? '', colStarts[ci + 1] + 4, y + 8)
        if (wrapped[1]) doc.text(wrapped[1], colStarts[ci + 1] + 4, y + 15)
      })
      y += rowH
    })
  } else {
    // Fallback plain text
    doc.setTextColor(26, 26, 26)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const wrapped = doc.splitTextToSize(text, 270)
    let ty = tableTop + 14
    for (const l of wrapped) {
      if (ty > 185) { doc.addPage(); ty = 20 }
      doc.text(l, tableLeft, ty)
      ty += 5.5
    }
  }

  addPdfFooter(doc, true)
  doc.save(`planning-rosa-${Date.now().toString().slice(-6)}.pdf`)
}

async function exportCourrierPDF(text: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const logo = await loadLogo()
  addPdfHeader(doc, logo, false)

  doc.setTextColor(26, 26, 26)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(text, 180)
  let y = 52
  for (const line of lines) {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.text(line, 15, y)
    y += 6.5
  }

  addPdfFooter(doc, false)
  doc.save(`courrier-rosa-${Date.now().toString().slice(-6)}.pdf`)
}

async function exportGenericPDF(text: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const logo = await loadLogo()
  addPdfHeader(doc, logo, false)

  doc.setTextColor(26, 26, 26)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  const lines = doc.splitTextToSize(text, 180)
  let y = 52
  for (const line of lines) {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.text(line, 15, y)
    y += 5.5
  }

  addPdfFooter(doc, false)
  doc.save(`zara-document-${Date.now().toString().slice(-6)}.pdf`)
}

function getPdfLabel(docType: DocType): string {
  if (docType === 'planning') return 'Télécharger le planning PDF'
  if (docType === 'courrier') return 'Télécharger le courrier PDF'
  if (docType === 'annonce') return 'Télécharger l\'annonce PDF'
  return 'Télécharger le document PDF'
}

async function exportPDF(text: string, docType: DocType) {
  if (docType === 'planning') return exportPlanningPDF(text)
  if (docType === 'courrier' || docType === 'annonce') return exportCourrierPDF(text)
  return exportGenericPDF(text)
}

function buildEmailLink(content: string): string {
  const subject = encodeURIComponent('Document - Rosa Excavator')
  const body = encodeURIComponent(content + '\n\nRosa Excavator\nTél : +596 696 34 31 21\ncontact@rosaexcavator.com')
  return `mailto:?subject=${subject}&body=${body}`
}

export default function ZaraChat({ client }: { client: ClientConfig; userId: string }) {
  const [messages, setMessages] = useState<ExtendedMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showPlanning, setShowPlanning] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendWithText(text: string) {
    if (!text.trim() || loading) return
    setInput('')
    setLoading(true)
    const userMsg: ExtendedMessage = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    try {
      const apiMessages = updated.filter((m, i) => !(i === 0 && m.role === 'assistant')).map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/agents/zara', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: apiMessages, clientSlug: client.slug }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message, timestamp: new Date().toISOString(), docType: data.docType ?? null }])
    } catch { toast.error('Erreur de connexion. Réessayez.') }
    finally { setLoading(false) }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: ExtendedMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const apiMessages = updatedMessages
        .filter((m, i) => !(i === 0 && m.role === 'assistant'))
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/agents/zara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, clientSlug: client.slug }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        docType: data.docType ?? null,
      }])
    } catch {
      toast.error('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  async function copyMessage(text: string, index: number) {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Copié !')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  function onPlanningCreated(summary: string) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: summary,
      timestamp: new Date().toISOString(),
      docType: 'planning',
    }])
    toast.success('Planning ajouté au chat !')
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#0A0A0A' }}>
      <header className="flex-shrink-0 border-b border-zinc-800 px-4 py-3 flex items-center gap-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <Link href={`/${client.slug}/dashboard`} className="text-zinc-400 p-1 -ml-1 min-h-[44px] flex items-center">
          <ArrowLeft size={20} />
        </Link>
        <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
          <Image src={ZARA_PHOTO} alt="Zara" fill className="object-cover object-top" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-white font-semibold text-sm leading-tight">Zara — Assistante Personnelle</h1>
          <p className="text-zinc-500 text-xs">Planning, communications, documents...</p>
        </div>
        <button
          onClick={() => setShowPlanning(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold shrink-0 min-h-[44px] hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#C4607A' }}
        >
          <CalendarDays size={14} />
          <span className="hidden sm:inline">Planning</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="group relative">
            <ChatMessage
              message={msg}
              primaryColor="#6366f1"
              agentName="Zara"
              agentPhoto={ZARA_PHOTO}
            />
            {msg.role === 'assistant' && i > 0 && (
              <div className="flex flex-wrap gap-2 mt-1 ml-11">
                <button
                  onClick={() => copyMessage(msg.content, i)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  title="Copier"
                >
                  {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedIndex === i ? 'Copié' : 'Copier'}</span>
                </button>
                {msg.docType && (
                  <button
                    onClick={() => exportPDF(msg.content, msg.docType!)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors text-zinc-500 hover:text-white hover:bg-zinc-800"
                    title="Exporter en PDF"
                  >
                    <FileDown size={12} />
                    <span>{getPdfLabel(msg.docType)}</span>
                  </button>
                )}
                {msg.docType && (
                  <a
                    href={buildEmailLink(msg.content)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors text-zinc-500 hover:text-white hover:bg-zinc-800"
                    title="Envoyer par email"
                  >
                    <Mail size={12} />
                    <span>Envoyer par email</span>
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
              <Image src={ZARA_PHOTO} alt="Zara" fill className="object-cover object-top" />
            </div>
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-zinc-800 px-4 py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <form onSubmit={sendMessage} className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(e)
              }
            }}
            placeholder="Décrivez ce dont vous avez besoin..."
            rows={2}
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none min-h-[48px]"
            style={{ fontSize: '16px' }}
            disabled={loading}
          />
          <VoiceMicButton
            onTranscript={setInput}
            onAutoSend={sendWithText}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40 bg-indigo-500 self-end min-h-[48px] min-w-[48px]"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="hidden sm:block text-zinc-600 text-xs mt-2">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
      </div>

      {showPlanning && (
        <PlanningModal
          clientSlug={client.slug}
          onClose={() => setShowPlanning(false)}
          onPlanningCreated={onPlanningCreated}
        />
      )}
    </div>
  )
}
