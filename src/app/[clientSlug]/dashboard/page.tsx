import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { getClientConfig } from '@/lib/clients'
import { AGENTS } from '@/types'
import SetupBanner from '@/components/dashboard/SetupBanner'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'

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

      {/* ── Sidebar (desktop only) ─────────────────────────────── */}
      <div className="hidden lg:block">
        <Sidebar clientSlug={clientSlug} />
      </div>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-y-auto px-4 py-6 lg:px-10 lg:py-10 pb-20 lg:pb-10">

        {/* Greeting */}
        <h1 className="text-center text-2xl lg:text-3xl font-bold text-white mb-4 lg:mb-6 tracking-tight">
          Bonjour, Rosa
        </h1>

        {/* First-time setup banner */}
        <SetupBanner clientSlug={clientSlug} />

        {/* Agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 max-w-3xl mx-auto w-full">
          {enabledAgents.map((agent) => {
            const cardColor = AGENT_CARD_COLORS[agent.id] ?? client.primaryColor
            const photo = AGENT_PHOTOS[agent.id]

            return (
              <Link
                key={agent.id}
                href={`/${clientSlug}/agents/${agent.id}`}
                className="relative overflow-hidden rounded-2xl flex flex-col cursor-pointer group"
                style={{ backgroundColor: cardColor }}
              >
                {/* Photo */}
                <div className="relative w-full" style={{ height: 'clamp(160px, 40vw, 270px)' }}>
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
                      <span className="text-white font-bold" style={{ fontSize: '64px', opacity: 0.3 }}>
                        {agent.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name + role */}
                <div className="flex flex-col justify-center px-4 py-3 lg:px-5 lg:flex-1">
                  <p className="text-white font-bold text-sm lg:text-base leading-tight">{agent.name}</p>
                  <p className="text-xs lg:text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{agent.role}</p>
                </div>

                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" />
              </Link>
            )
          })}

          {/* Devis history card */}
          <Link
            href={`/${clientSlug}/devis`}
            className="relative overflow-hidden rounded-2xl flex flex-col cursor-pointer group"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <div className="w-full flex items-center justify-center" style={{ height: 'clamp(160px, 40vw, 270px)' }}>
              <FileText style={{ color: '#C4607A', opacity: 0.6, width: 'clamp(48px, 12vw, 80px)', height: 'clamp(48px, 12vw, 80px)' }} />
            </div>
            <div className="flex flex-col justify-center px-4 py-3 lg:px-5">
              <p className="text-white font-bold text-sm lg:text-base leading-tight">Historique Devis</p>
              <p className="text-xs lg:text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Retrouvez tous vos devis générés</p>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl" />
          </Link>
        </div>
      </main>

      {/* ── Bottom Nav (mobile only) ─────────────────────────── */}
      <BottomNav clientSlug={clientSlug} />
    </div>
  )
}
