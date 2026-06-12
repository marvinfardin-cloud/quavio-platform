'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ClientConfig, Message, DevisData } from '@/types'
import ChatMessage from '@/components/chat/ChatMessage'
import DevisPreview from '@/components/agents/DevisPreview'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, FileText } from 'lucide-react'

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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        toast.success('Devis généré ! Vous pouvez le télécharger.')
      }
    } catch {
      toast.error('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg, #0A0A0A)' }}
    >
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link
          href={`/${client.slug}/dashboard`}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: client.primaryColor }}
        >
          I
        </div>
        <div>
          <h1 className="text-white font-semibold">Isaac</h1>
          <p className="text-zinc-500 text-xs">Générateur de Devis</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                primaryColor={client.primaryColor}
                agentName="Isaac"
              />
            ))}
            {loading && (
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: client.primaryColor }}
                >
                  I
                </div>
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-zinc-800 px-6 py-4">
            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Décrivez le chantier..."
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-3 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: client.primaryColor }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {currentDevis && (
          <div className="w-96 border-l border-zinc-800 overflow-y-auto">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
              <FileText size={16} className="text-zinc-400" />
              <span className="text-white text-sm font-medium">Aperçu du devis</span>
            </div>
            <DevisPreview devis={currentDevis} client={client} />
          </div>
        )}
      </div>
    </div>
  )
}
