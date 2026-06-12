export interface ClientConfig {
  id: string
  slug: string
  name: string
  primaryColor: string
  backgroundColor: string
  logoUrl: string | null
  enabledAgents: string[]
}

export interface AgentConfig {
  id: string
  name: string
  role: string
  description: string
  photoUrl: string
  color: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface DevisData {
  clientName: string
  clientAddress: string
  services: Array<{
    description: string
    quantity: number
    unit: string
    unitPrice: number
    total: number
  }>
  totalHT: number
  tva: number
  totalTTC: number
}

export const AGENTS: Record<string, AgentConfig> = {
  isaac: {
    id: 'isaac',
    name: 'Isaac',
    role: 'Générateur de Devis',
    description: 'Crée des devis professionnels à partir de votre description.',
    photoUrl: '/agents/ISAAC.JPEG',
    color: '#E85D26',
  },
  zara: {
    id: 'zara',
    name: 'Zara',
    role: 'Assistante Communication',
    description: 'Rédige des réponses professionnelles à vos clients.',
    photoUrl: '/agents/ZARA.JPEG',
    color: '#6366f1',
  },
}
