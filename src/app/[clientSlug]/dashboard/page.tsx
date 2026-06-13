import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClientConfig } from '@/lib/clients'
import { Home, FileText, Settings } from 'lucide-react'

const AGENT_CARDS = [
  {
    id: 'isaac',
    name: 'Isaac',
    role: 'Generateur de Devis',
    photo: '/agents/ISAAC.JPEG',
    accent: '#C4607A',
  },
  {
    id: 'zara',
    name: 'Zara',
    role: 'Assistante Communication',
    photo: '/agents/ZARA.JPEG',
    accent: '#7C3AED',
  },
]

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const client = await getClientConfig(clientSlug)
  if (!client) redirect('/')

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* Sidebar */}
      <aside
        className="w-16 flex flex-col items-center py-5 gap-6 flex-shrink-0"
        style={{ backgroundColor: '#111111', borderRight: '1px solid #1f1f1f' }}
      >
        {/* Rosa logo */}
        <div className="mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/agents/rosa_logo.png"
            width={36}
            height={36}
            alt="Rosa"
            style={{
              objectFit: 'contain',
              background: 'white',
              borderRadius: '50%',
              display: 'block',
            }}
          />
        </div>

        <nav className="flex flex-col items-center gap-5 flex-1">
          <Link
            href={`/${clientSlug}/dashboard`}
            className="p-2.5 rounded-xl transition-colors"
            style={{ color: '#C4607A', backgroundColor: '#C4607A1a' }}
            title="Accueil"
          >
            <Home size={20} />
          </Link>
          <Link
            href={`/${clientSlug}/devis`}
            className="p-2.5 rounded-xl transition-colors"
            style={{ color: '#555' }}
            title="Devis"
          >
            <FileText size={20} />
          </Link>
          <Link
            href={`/${clientSlug}/settings`}
            className="p-2.5 rounded-xl transition-colors"
            style={{ color: '#555' }}
            title="Parametres"
          >
            <Settings size={20} />
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        {/* Title */}
        <h1
          className="text-3xl font-bold text-white mb-8"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Bonjour, Rosa
        </h1>

        {/* Agent cards */}
        <div className="flex gap-4 mb-6 flex-wrap">
          {AGENT_CARDS.map((agent) => (
            <Link
              key={agent.id}
              href={`/${clientSlug}/agents/${agent.id}`}
              className="block rounded-2xl overflow-hidden flex-shrink-0 hover:scale-[1.02] transition-transform"
              style={{ width: '200px', height: '280px' }}
            >
              {/* Photo top 70% */}
              <div style={{ height: '70%', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={agent.photo}
                  alt={agent.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top',
                    display: 'block',
                  }}
                />
              </div>
              {/* Bottom band 30% */}
              <div
                className="flex flex-col justify-center px-4"
                style={{ height: '30%', backgroundColor: agent.accent }}
              >
                <span className="text-white font-bold text-base leading-tight">
                  {agent.name}
                </span>
                <span
                  className="text-xs mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  {agent.role}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Historique Devis card */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f' }}
        >
          <h2 className="text-white font-semibold text-sm mb-3">
            Historique Devis
          </h2>
          <p className="text-sm" style={{ color: '#555' }}>
            Aucun devis genere pour le moment.
          </p>
        </div>
      </main>
    </div>
  )
}
