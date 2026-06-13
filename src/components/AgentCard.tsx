'use client'

import Link from 'next/link'
import { useState } from 'react'

interface AgentCardProps {
  id: string
  name: string
  role: string
  photo: string
  accent: string
  clientSlug: string
}

export default function AgentCard({ id, name, role, photo, accent, clientSlug }: AgentCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <Link
      href={`/${clientSlug}/agents/${id}`}
      className="block rounded-2xl overflow-hidden flex-shrink-0 hover:scale-[1.02] transition-transform"
      style={{ width: '200px', height: '280px' }}
    >
      {/* Photo top 70% */}
      <div style={{ height: '70%', overflow: 'hidden', backgroundColor: accent, position: 'relative' }}>
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top',
              display: 'block',
            }}
          />
        ) : (
          /* Fallback gradient when image missing */
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${accent}cc 0%, ${accent}44 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontSize: 48, fontWeight: 700, opacity: 0.5 }}>
              {name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      {/* Bottom band 30% */}
      <div
        className="flex flex-col justify-center px-4"
        style={{ height: '30%', backgroundColor: accent }}
      >
        <span className="text-white font-bold text-base leading-tight">{name}</span>
        <span className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {role}
        </span>
      </div>
    </Link>
  )
}
