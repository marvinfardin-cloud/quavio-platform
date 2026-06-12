'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ClientConfig, Message, DevisData } from '@/types'
import ChatMessage from '@/components/chat/ChatMessage'
import DevisPreview from '@/components/agents/DevisPreview'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, FileText, X } from 'lucide-react'
import VoiceMicButton from '@/components/chat/VoiceMicButton'

const ISAAC_PHOTO = '/agents/ISAAC.JPEG'

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `Bonjour ! Je suis Isaac, votre assistant devis Rosa Excavator.

Décrivez-moi le chantier et je génère un devis complet. Par exemple :

"Devis pour M. Martin à Le Lamentin — terrassement 200m², évacuation gravats"

Commencez !`,
  timestamp: new Date().toISOString(),
}

export default function IsaacChat({
  client,
}: {
  client: ClientConfig
  userId: string
}) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentDevis, setCurrentDevis] = useState<DevisData | null>(null)
  const [showDevis, setShowDevis] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendWithText(text: string) {
    if (!text.trim() || loading) return
    setInput('')
    setLoading(true)
    const userMessage: Message = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    try {
      const res = await fetch('/api/agents/isaac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.filter((m) => m.role !== 'assistant' || m !== WELCOME_MESSAGE).map((m) => ({ role: m.role, content: m.content })),
          clientSlug: client.slug,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message, timestamp: new Date().toISOString() }])
      if (data.devis) { setCurrentDevis(data.devis); setShowDevis(true); toast.success('Devis généré !') }
    } catch { toast.error('Erreur de connexion. Réessayez.') }
    finally { setLoading(false) }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/agents/isaac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.filter((m) => m.role !== 'assistant' || m !== WELCOME_MESSAGE).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          clientSlug: client.slug,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (data.devis) {
        setCurrentDevis(data.devis)
        setShowDevis(true)
        toast.success('Devis généré !')
      }
    } catch {
      toast.error('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#0A0A0A' }}>

      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800 px-4 py-3 flex items-center gap-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <Link href={`/${client.slug}/dashboard`} className="text-zinc-400 p-1 -ml-1 min-h-[44px] flex items-center">
          <ArrowLeft size={20} />
        </Link>
        <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
          <Image src={ISAAC_PHOTO} alt="Isaac" fill className="object-cover object-top" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-semibold text-sm leading-tight">Isaac</h1>
          <p className="text-zinc-500 text-xs">Générateur de Devis</p>
        </div>
        {currentDevis && (
          <button
            onClick={() => setShowDevis(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-medium min-h-[44px]"
            style={{ backgroundColor: client.primaryColor }}
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Voir devis</span>
          </button>
        )}
      </header>

      {/* Chat area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            <div className="px-4 space-y-3 max-w-2xl mx-auto w-full">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  message={msg}
                  primaryColor={client.primaryColor}
                  agentName="Isaac"
                  agentPhoto={ISAAC_PHOTO}
                />
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
                    <Image src={ISAAC_PHOTO} alt="Isaac" fill className="object-cover object-top" />
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
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 border-t border-zinc-800 px-4 py-3"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <form onSubmit={sendMessage} className="flex gap-2 max-w-2xl mx-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Décrivez le chantier..."
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors min-h-[48px]"
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
                className="px-4 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40 min-h-[48px] min-w-[48px]"
                style={{ backgroundColor: client.primaryColor }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Devis panel — desktop side panel */}
        {currentDevis && showDevis && (
          <div className="hidden lg:flex w-96 border-l border-zinc-800 flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
              <FileText size={16} className="text-zinc-400" />
              <span className="text-white text-sm font-medium flex-1">Aperçu du devis</span>
              <button onClick={() => setShowDevis(false)} className="text-zinc-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <DevisPreview devis={currentDevis} client={client} />
            </div>
          </div>
        )}
      </div>

      {/* Devis modal — mobile full screen overlay */}
      {currentDevis && showDevis && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#0A0A0A' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800"
            style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
            <FileText size={16} style={{ color: '#C4607A' }} />
            <span className="text-white text-sm font-medium flex-1">Aperçu du devis</span>
            <button onClick={() => setShowDevis(false)} className="text-zinc-400 p-1 min-h-[44px] flex items-center">
              <X size={20} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <DevisPreview devis={currentDevis} client={client} />
          </div>
        </div>
      )}
    </div>
  )
}
