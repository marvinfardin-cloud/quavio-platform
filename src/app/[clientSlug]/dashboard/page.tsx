import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Home, Bot, Settings, FileText } from 'lucide-react'
import { getClientConfig } from '@/lib/clients'
import { AGENTS } from '@/types'
import SetupBanner from '@/components/dashboard/SetupBanner'

const AGENT_CARD_COLORS: Record<string, string> = {
  isaac: '#C4607A',
  zara: '#7C3AED',
}

const AGENT_PHOTOS: Record<string, string> = {
  isaac: '/agents/ISAAC.JPEG',
  zara: '/agents/ZARA.JPEG',
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const client = await getClientConfig(clientSlug)
  if (!client) redirect('/')

  const enabledAgents = client.enabledAgents
    .map((id) => AGENTS[id])
    .filter(Boolean)

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0F0F0F', fontFamily: 'var(--font-space-grotesk)' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className="flex flex-col items-center py-6 gap-8 flex-shrink-0"
        style={{ width: '60px', backgroundColor: '#0A0A0A', borderRight: '1px solid #1a1a1a' }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rosa_logo.png"
          alt="Rosa"
          width={36}
          height={36}
          className="rounded-full object-cover flex-shrink-0"
        />

        {/* Nav icons */}
        <nav className="flex flex-col items-center gap-6 mt-2">
          <button className="text-white opacity-90 hover:opacity-100 transition-opacity" title="Accueil">
            <Home size={20} />
          </button>
          <button className="text-zinc-500 hover:text-white transition-colors" title="Agents">
            <Bot size={20} />
          </button>
          <Link href={`/${clientSlug}/settings`} className="text-zinc-500 hover:text-white transition-colors" title="Paramètres">
            <Settings size={20} />
          </Link>
        </nav>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-y-auto px-10 py-10">

        {/* Greeting */}
        <h1 className="text-center text-3xl font-bold text-white mb-6 tracking-tight">
          Bonjour, Rosa
        </h1>

        {/* First-time setup banner */}
        <SetupBanner clientSlug={clientSlug} />

        {/* Search bar */}
        <div className="max-w-xl mx-auto w-full mb-10">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span style={{ color: '#555', fontSize: '14px' }}>Que recherchez-vous ?</span>
          </div>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto w-full">
          {enabledAgents.map((agent) => {
            const cardColor = AGENT_CARD_COLORS[agent.id] ?? client.primaryColor
            const photo = AGENT_PHOTOS[agent.id]

            return (
              <Link
                key={agent.id}
                href={`/${clientSlug}/agents/${agent.id}`}
                className="relative overflow-hidden rounded-2xl flex flex-col cursor-pointer group"
                style={{ height: '360px', backgroundColor: cardColor }}
              >
                {/* Photo — top 70% */}
                <div className="relative w-full" style={{ height: '270px' }}>
                  {photo ? (
                    <Image
                      src={photo}
                      alt={agent.name}
                      fill
                      className="object-cover"
                      style={{ objectPosition: 'center top' }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white font-bold" style={{ fontSize: '80px', opacity: 0.3 }}>
                        {agent.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom 30% — name + role */}
                <div className="flex flex-col justify-center px-5 flex-1">
                  <p className="text-white font-bold text-base leading-tight">{agent.name}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{agent.role}</p>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" />
              </Link>
            )
          })}

          {/* Devis history card */}
          <Link
            href={`/${clientSlug}/devis`}
            className="relative overflow-hidden rounded-2xl flex flex-col cursor-pointer group"
            style={{ height: '360px', backgroundColor: '#1a1a1a' }}
          >
            <div className="w-full flex items-center justify-center" style={{ height: '270px' }}>
              <FileText size={80} style={{ color: '#C4607A', opacity: 0.6 }} />
            </div>
            <div className="flex flex-col justify-center px-5 flex-1">
              <p className="text-white font-bold text-base leading-tight">Historique Devis</p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Retrouvez tous vos devis générés</p>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl" />
          </Link>
        </div>
      </main>
    </div>
  )
}
