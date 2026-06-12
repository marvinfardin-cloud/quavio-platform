import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getClientConfig } from '@/lib/clients'
import { AGENTS } from '@/types'

function getTodayFR() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const AGENT_AVATAR_COLORS: Record<string, string> = {
  isaac: '#E85D26',
  zara: '#6366f1',
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
    <div className="min-h-screen" style={{ backgroundColor: client.backgroundColor }}>
      {/* Header */}
      <header className="border-b border-zinc-800 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
            style={{ backgroundColor: client.primaryColor }}
          >
            {client.name.charAt(0)}
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            {client.name}
          </span>
        </div>
        <div className="text-right">
          <p className="text-zinc-400 text-sm capitalize">{getTodayFR()}</p>
          <p className="text-white font-semibold text-sm mt-0.5">Bonjour Rosa</p>
        </div>
      </header>

      {/* Agent cards */}
      <main className="px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {enabledAgents.map((agent) => {
            const avatarColor = AGENT_AVATAR_COLORS[agent.id] ?? client.primaryColor
            return (
              <div
                key={agent.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col"
                style={{ height: '280px' }}
              >
                {/* Initials avatar */}
                <div
                  className="w-full flex-shrink-0 flex items-center justify-center"
                  style={{ height: '160px', backgroundColor: avatarColor }}
                >
                  <span className="text-white font-bold" style={{ fontSize: '72px', lineHeight: 1 }}>
                    {agent.name.charAt(0)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 px-5 pt-4 pb-4">
                  <div className="flex-1">
                    <h2 className="text-white font-bold text-lg leading-tight">{agent.name}</h2>
                    <p className="text-sm font-medium mt-0.5" style={{ color: avatarColor }}>
                      {agent.role}
                    </p>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#999' }}>
                      {agent.description}
                    </p>
                  </div>

                  <Link
                    href={`/${clientSlug}/agents/${agent.id}`}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: avatarColor }}
                  >
                    Lancer &rarr;
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
