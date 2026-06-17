'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface RelanceMessage {
  canal: string
  destinataire: string
  message: string
}

interface RelanceCardProps {
  data: {
    messages: RelanceMessage[]
  }
}

export default function RelanceCard({ data }: RelanceCardProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  async function copy(text: string, idx: number) {
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    toast.success('Copié !')
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="px-4 pb-4">
      <p className="text-white font-bold mb-3">Messages de relance</p>
      {data.messages.map((msg, i) => (
        <div
          key={i}
          className="rounded-xl p-4 mb-3"
          style={{ backgroundColor: '#111', border: '1px solid #27272a' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ backgroundColor: '#14532d', color: '#86efac' }}
            >
              {msg.canal}
            </span>
            <span className="text-white font-semibold text-sm">{msg.destinataire}</span>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => copy(msg.message, i)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            >
              {copiedIdx === i ? <Check size={12} /> : <Copy size={12} />}
              {copiedIdx === i ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
