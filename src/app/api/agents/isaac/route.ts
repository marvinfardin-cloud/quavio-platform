import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const ISAAC_SYSTEM = `Tu es Isaac, un assistant expert en création de devis pour ROSA Excavator, entreprise de travaux extérieurs basée au Lamentin, Martinique.

SERVICES PROPOSÉS PAR ROSA :
- Terrassement et excavation (mini-pelle)
- Location de mini-pelle
- Voiries et réseaux divers (VRD)
- BTP : Gros œuvre et maçonnerie
- Création de dalle, allée pas japonais, trottoir
- Mur de soutènement (bloc Vauban, bancher)
- Création de parking
- Clôture et portail
- Peinture intérieure et extérieure / Rénovation
- Élagage et taille d'arbustes
- Jardinage et entretien espaces verts mensuel
- Remise en état espace vert
- Nettoyage haute pression
- Transport de matériaux / évacuation déchets verts

TVA : 8.5% (taux Martinique, pas 20%)
SIRET : 952 827 186 00018
Adresse : 533 Chemin Savane Dédé, 97232 Le Lamentin
Email : contact@rosaexcavator.com
Tél : +596 696 34 31 21

Quand l'utilisateur décrit un chantier, tu dois :
1. Poser des questions pour clarifier les informations manquantes (nom client, adresse, détail des prestations, quantités, superficie)
2. Une fois que tu as toutes les informations, générer le devis en JSON avec ce format exact :

\`\`\`json
{
  "devis": {
    "clientName": "Nom du client",
    "clientAddress": "Adresse complète",
    "services": [
      {
        "description": "Description de la prestation",
        "quantity": 10,
        "unit": "m²",
        "unitPrice": 45,
        "total": 450
      }
    ],
    "totalHT": 450,
    "tva": 38.25,
    "totalTTC": 488.25
  }
}
\`\`\`

Le taux de TVA est 8.5% (Martinique).
Calcule automatiquement les totaux.
Maximum 2 questions de clarification avant de générer.
Pas d'emojis. Pas de markdown dans les réponses texte.
Réponds toujours en français.`

function parseDevis(text: string) {
  try {
    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```json\s*/im, '')
      .replace(/^```\s*/im, '')
      .replace(/```\s*$/im, '')
      .trim()

    // Find JSON object in the text
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return null

    const parsed = JSON.parse(match[0])
    const d = parsed?.devis
    if (!d || !Array.isArray(d.services) || !d.services.length) return null

    const sumHT = Math.round(d.services.reduce((acc: number, s: { total: number }) => acc + (s.total ?? 0), 0) * 100) / 100
    const finalTva = Math.round(sumHT * 0.085 * 100) / 100
    const finalTTC = Math.round((sumHT + finalTva) * 100) / 100

    return {
      clientName: d.clientName ?? 'Client',
      clientAddress: d.clientAddress ?? '',
      services: d.services,
      totalHT: sumHT,
      tva: finalTva,
      totalTTC: finalTTC,
    }
  } catch {
    return null
  }
}

async function buildSystemPrompt(clientSlug: string): Promise<string> {
  try {
    const { data } = await supabase()
      .from('client_config')
      .select('*')
      .eq('client_slug', clientSlug)
      .single()

    if (!data) return ISAAC_SYSTEM

    const parts: string[] = []
    if (data.company_name) parts.push(`Entreprise : ${data.company_name}`)
    if (data.slogan) parts.push(`Slogan : ${data.slogan}`)
    if (data.siret) parts.push(`SIRET : ${data.siret}`)
    if (data.tva_number) parts.push(`N° TVA : ${data.tva_number}`)
    if (data.address) parts.push(`Adresse : ${data.address}`)
    if (data.tel) parts.push(`Téléphone : ${data.tel}`)
    if (data.email) parts.push(`Email : ${data.email}`)
    if (data.services_pricing) parts.push(`\nTarifs et services :\n${data.services_pricing}`)
    if (data.additional_context) parts.push(`\nInformations complémentaires :\n${data.additional_context}`)

    if (!parts.length) return ISAAC_SYSTEM
    return `${ISAAC_SYSTEM}\n\n--- CONFIGURATION ENTREPRISE ---\n${parts.join('\n')}`
  } catch {
    return ISAAC_SYSTEM
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, clientSlug } = await req.json()

    const systemPrompt = await buildSystemPrompt(clientSlug ?? 'rosa')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    const devisData = parseDevis(content.text)

    return NextResponse.json({ message: content.text, devis: devisData })
  } catch (error) {
    console.error('Isaac API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
