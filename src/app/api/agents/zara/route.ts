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

const ZARA_SYSTEM = `Tu es Zara, l'assistante personnelle de Catheline ROSALIE (Rosa), dirigeante de Rosa Excavator.
Tu l'aides dans toutes les tâches administratives et organisationnelles de son entreprise au quotidien.

ENTREPRISE:
- Nom: ROSA EXCAVATOR - RENTAL AND SERVICE
- Dirigeante: Catheline ROSALIE (Rosa)
- SIRET: 952 827 186 00018 | TVA: FR16 952 827 186
- Adresse: 533 Chemin Savane Dédé, 97232 Le Lamentin, Martinique
- Tel: +596 696 34 31 21 | Email: contact@rosaexcavator.com
- Services: Terrassement, BTP, espaces verts, élagage, nettoyage, location mini-pelle, peinture, transport

ÉQUIPE TERRAIN (3 employés):
- Marcus Mathurin
- Nicky Antoine
- William Joseph-Julien

TU PEUX AIDER AVEC:
- Planning hebdomadaire ou mensuel des 3 employés terrain
- Rédaction messages WhatsApp professionnels pour les clients
- Réponses aux avis Google
- Emails clients et relances
- Annonces de recrutement
- Courriers administratifs
- Comptes-rendus de chantier
- Conseils gestion quotidienne
- Tout document professionnel lié à l'entreprise

FORMAT PLANNING:
Quand Rosa décrit les chantiers, génère un planning structuré:

PLANNING SEMAINE DU [date]

LUNDI [date]:
- Marcus Mathurin : [chantier] - [adresse] - [notes]
- Nicky Antoine : [chantier] - [adresse] - [notes]
- William Joseph-Julien : [chantier] - [adresse] - [notes]

MARDI [date]:
...etc

COMPORTEMENT:
- Tu réponds en français, ton chaleureux et professionnel
- Tu tutoies Rosa naturellement
- Tu ne te présentes QUE dans le premier message
- Tu génères directement le contenu demandé sans trop de questions
- Quand tu produis un planning ou document structuré, tu le formates proprement pour export PDF
- Pas d'emojis, pas de markdown gras
- Tu t'adaptes: court ou long selon le besoin
- Tu connais le contexte de Rosa et l'utilises naturellement
- Quand Rosa dit 'fais le planning de la semaine' tu lui demandes juste les chantiers prévus si elle ne les a pas donnés`

async function buildSystemPrompt(clientSlug: string): Promise<string> {
  try {
    const { data } = await supabase()
      .from('client_config')
      .select('*')
      .eq('client_slug', clientSlug)
      .single()

    if (!data) return ZARA_SYSTEM

    const parts: string[] = []
    if (data.company_name) parts.push(`Entreprise : ${data.company_name}`)
    if (data.address) parts.push(`Adresse : ${data.address}`)
    if (data.tel) parts.push(`Téléphone : ${data.tel}`)
    if (data.services_pricing) parts.push(`\nServices :\n${data.services_pricing}`)
    if (data.additional_context) parts.push(`\nContexte :\n${data.additional_context}`)

    if (!parts.length) return ZARA_SYSTEM
    return `${ZARA_SYSTEM}\n\n--- CONFIGURATION PERSONNALISÉE ---\n${parts.join('\n')}`
  } catch {
    return ZARA_SYSTEM
  }
}

type DocType = 'planning' | 'courrier' | 'annonce' | 'document' | null

function detectDocType(text: string): DocType {
  const upper = text.toUpperCase()
  const planningKeywords = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']
  const hasPlanningDay = planningKeywords.filter(k => upper.includes(k)).length >= 2
  if (hasPlanningDay) return 'planning'
  const courrierKeywords = ['OBJET :', 'MADAME', 'MONSIEUR', 'CORDIALEMENT', 'COMPTE-RENDU', 'FAIT À', 'LE ']
  if (courrierKeywords.filter(k => upper.includes(k)).length >= 2) return 'courrier'
  const annonceKeywords = ['ANNONCE', 'POSTE :', 'PROFIL :', 'CANDIDATURE', 'REJOINDRE', 'RECRUTEMENT']
  if (annonceKeywords.some(k => upper.includes(k))) return 'annonce'
  const lineCount = text.split('\n').length
  if (lineCount >= 15) return 'document'
  return null
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

    return NextResponse.json({
      message: content.text,
      docType: detectDocType(content.text),
    })
  } catch (error) {
    console.error('Zara API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
