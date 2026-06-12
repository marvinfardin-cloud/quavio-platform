import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getClientConfig } from '@/lib/clients'
import { AGENTS } from '@/types'

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
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg, #0A0A0A)' }}
    >
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: 'var(--primary, #E85D26)' }}
          >
            {client.name.charAt(0)}
          </div>
          <span className="text-white font-semibold">{client.name}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">
            Bonjour 👋
          </h1>
          <p className="text-zinc-400 text-lg">
            Choisissez un agent pour commencer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enabledAgents.map((agent) => (
            <Link
              key={agent.id}
              href={`/${clientSlug}/agents/${agent.id}`}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-8 hover:border-zinc-600 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-8 translate-x-8"
                style={{ backgroundColor: agent.color }}
              />
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-5"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{agent.name}</h2>
                <p
                  className="text-sm font-medium mb-3"
                  style={{ color: agent.color }}
                >
                  {agent.role}
                </p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {agent.description}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">
                <span>Lancer</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
