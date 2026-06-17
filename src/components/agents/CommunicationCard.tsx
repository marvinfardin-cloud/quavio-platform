'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Variante {
  ton: string
  message: string
}

interface CommunicationCardProps {
  data: {
    variantes: Variante[]
  }
}

export default function CommunicationCard({ data }: CommunicationCardProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  async function copy(text: string, idx: number) {
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    toast.success('Copié !')
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="px-4 pb-4">
      <p className="text-white font-bold mb-3">Réponses suggérées</p>
      {data.variantes.map((v, i) => (
        <div
          key={i}
          className="rounded-xl p-4 mb-3"
          style={{ backgroundColor: '#111', border: '1px solid #27272a' }}
        >
          <span
            className="text-xs px-2 py-0.5 rounded capitalize"
            style={{ backgroundColor: '#3f3f46', color: '#d4d4d8' }}
          >
            {v.ton}
          </span>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap mt-2">{v.message}</p>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => copy(v.message, i)}
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
