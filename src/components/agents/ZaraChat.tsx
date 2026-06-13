'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ClientConfig, Message } from '@/types'
import ChatMessage from '@/components/chat/ChatMessage'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, Copy, Check } from 'lucide-react'
import WeeklyPlanningModal from './WeeklyPlanningModal'

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `Bonjour ! Je suis Zara, votre assistante communication. 💬

Collez le message d'un client et je vous proposerai une réponse professionnelle adaptée à l'image de ROSA Aménagement.

Par exemple : *"Bonjour, j'aimerais un devis pour mon jardin, pouvez-vous venir cette semaine ?"*`,
  timestamp: new Date().toISOString(),
}

export default function ZaraChat({
  client,
}: {
  client: ClientConfig
  userId: string
}) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showPlanning, setShowPlanning] = useState(false)
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
      const apiMessages = updatedMessages
        .filter((m, i) => !(i === 0 && m.role === 'assistant'))
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/agents/zara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
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
    <>
    {showPlanning && (
      <WeeklyPlanningModal clientSlug={client.slug} onClose={() => setShowPlanning(false)} />
    )}
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
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-indigo-500">
          Z
        </div>
        <div>
          <h1 className="text-white font-semibold">Zara</h1>
          <p className="text-zinc-500 text-xs">Assistante Communication</p>
        </div>
      </header>

      {/* Weekly planning button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => setShowPlanning(true)}
          className="w-full font-semibold text-white rounded-xl transition-opacity hover:opacity-90 active:opacity-80"
          style={{ backgroundColor: '#C4607A', height: '48px' }}
        >
          Générer un planning
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="group relative">
            <ChatMessage
              message={msg}
              primaryColor="#6366f1"
              agentName="Zara"
            />
            {msg.role === 'assistant' && i > 0 && (
              <button
                onClick={() => copyMessage(msg.content, i)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                title="Copier la réponse"
              >
                {copiedIndex === i ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-indigo-500">
              Z
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
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(e)
              }
            }}
            placeholder="Collez le message du client ici..."
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
    </>
  )
}
