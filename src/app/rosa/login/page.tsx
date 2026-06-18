'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RosaLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)

    if (password === 'rosa2026') {
      // Set cookie via API route, then redirect
      await fetch('/api/auth/rosa', { method: 'POST' })
      router.push('/rosa/dashboard')
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#0A0A0A', fontFamily: 'var(--font-space-grotesk)' }}
    >
      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/agents/rosa_logo.png"
        alt="Rosa"
        width={72}
        height={72}
        className="mb-8 rounded-full"
        style={{ objectFit: 'contain', background: 'white', padding: '4px' }}
      />

      <div className="w-full max-w-sm">
        <h1 className="text-white text-2xl font-bold text-center mb-1">Espace Rosa</h1>
        <p className="text-zinc-500 text-sm text-center mb-8">Entrez votre mot de passe pour accéder</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-white placeholder-zinc-600 outline-none"
            style={{
              backgroundColor: '#111',
              border: '1px solid #2a2a2a',
              fontSize: '16px',
            }}
          />

          {error && (
            <p className="text-red-400 text-sm text-center">Mot de passe incorrect</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#C4607A' }}
          >
            {loading ? 'Vérification...' : 'Accéder'}
          </button>
        </form>
      </div>
    </div>
  )
}
