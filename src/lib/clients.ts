import { prisma } from './prisma'
import { ClientConfig } from '@/types'

const FALLBACK_CLIENTS: Record<string, ClientConfig> = {
  rosa: {
    id: 'rosa',
    slug: 'rosa',
    name: 'ROSA Aménagement',
    primaryColor: '#E85D26',
    backgroundColor: '#0A0A0A',
    logoUrl: null,
    enabledAgents: ['isaac', 'zara'],
  },
}

export async function getClientConfig(slug: string): Promise<ClientConfig | null> {
  try {
    const client = await prisma.client.findUnique({ where: { slug } })
    if (client) return client as ClientConfig
  } catch {
    // DB not reachable — use fallback seed data
  }

  return FALLBACK_CLIENTS[slug] ?? null
}
