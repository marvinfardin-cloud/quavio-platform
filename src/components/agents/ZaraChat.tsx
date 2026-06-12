'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ClientConfig, Message } from '@/types'
import ChatMessage from '@/components/chat/ChatMessage'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, Copy, Check, FileDown } from 'lucide-react'

const ZARA_PHOTO = '/agents/ZARA.JPEG'

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `Bonjour Rosa ! Je suis là pour vous aider dans votre quotidien.
Planning, messages clients, courriers, annonces...
Dites-moi ce dont vous avez besoin.`,
  timestamp: new Date().toISOString(),
}

interface ExtendedMessage extends Message {
  isDocument?: boolean
}

async function exportToPDF(text: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const PRIMARY: [number, number, number] = [196, 96, 122]
  const date = new Date().toLocaleDateString('fr-FR')

  // Header band
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, 210, 40, 'F')

  // Logo
  try {
    const res = await fetch('/agents/rosa_logo.png')
    if (res.ok) {
      const blob = await res.blob()
      const logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      doc.setFillColor(255, 255, 255)
      doc.circle(22, 20, 12, 'F')
      doc.addImage(logoDataUrl, 'PNG', 10, 8, 24, 24)
    }
  } catch {}

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Rosa Excavator — Rental and Service', 40, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Document généré par Zara  |  ${date}`, 40, 28)

  // Content
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)

  const lines = doc.splitTextToSize(text, 176)
  let y = 52
  for (const line of lines) {
    if (y > 275) {
      doc.addPage()
      y = 20
    }
    doc.text(line, 17, y)
    y += 5.5
  }

  // Footer
  doc.setDrawColor(220, 220, 220)
  doc.line(14, 282, 196, 282)
  doc.setTextColor(153, 153, 153)
  doc.setFontSize(7)
  doc.text(
    'ROSA EXCAVATOR  |  SIRET : 952 827 186 00018  |  533 Chemin Savane Dédé, 97232 Le Lamentin',
    105, 287, { align: 'center' }
  )

  doc.save(`zara-document-${Date.now().toString().slice(-6)}.pdf`)
}

export default function ZaraChat({ client }: { client: ClientConfig; userId: string }) {
  const [messages, setMessages] = useState<ExtendedMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

      const assistantMessage: ExtendedMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        isDocument: data.isDocument ?? false,
      }

      setMessages((prev) => [...prev, assistantMessage])
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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg, #0A0A0A)' }}>
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link href={`/${client.slug}/dashboard`} className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="w-9 h-9 rounded-full overflow-hidden relative flex-shrink-0">
          <Image src={ZARA_PHOTO} alt="Zara" fill className="object-cover object-top" />
        </div>
        <div>
          <h1 className="text-white font-semibold">Zara — Assistante Personnelle</h1>
          <p className="text-zinc-500 text-xs">Planning, communications, documents...</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="group relative">
            <ChatMessage
              message={msg}
              primaryColor="#6366f1"
              agentName="Zara"
              agentPhoto={ZARA_PHOTO}
            />
            {msg.role === 'assistant' && i > 0 && (
              <div className="flex gap-2 mt-1 ml-11">
                <button
                  onClick={() => copyMessage(msg.content, i)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  title="Copier"
                >
                  {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedIndex === i ? 'Copié' : 'Copier'}</span>
                </button>
                {msg.isDocument && (
                  <button
                    onClick={() => exportToPDF(msg.content)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors text-zinc-500 hover:text-white hover:bg-zinc-800"
                    title="Exporter en PDF"
                  >
                    <FileDown size={12} />
                    <span>Télécharger PDF</span>
                  </button>
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

      <div className="border-t border-zinc-800 px-6 py-4">
        <form onSubmit={sendMessage} className="flex gap-3">
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
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors text-sm resize-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40 bg-indigo-500 self-end pb-3 pt-3"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-zinc-600 text-xs mt-2">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
      </div>
    </div>
  )
}
