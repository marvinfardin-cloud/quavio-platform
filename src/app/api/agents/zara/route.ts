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

const ZARA_SYSTEM = `Tu es Zara, l'assistante personnelle de Rosa, dirigeante de Rosa Excavator.
Tu l'aides dans toutes les tâches administratives et organisationnelles de son entreprise au quotidien.

ENTREPRISE:
- Nom: ROSA EXCAVATOR - RENTAL AND SERVICE
- Dirigeante: Rosa
- SIRET: 952 827 186 00018 | TVA: FR16 952 827 186
- Adresse: 533 Chemin Savane Dédé, 97232 Le Lamentin, Martinique
- Tel: +596 696 34 31 21 | Email: contact@rosaexcavator.com
- Services: Terrassement, BTP, espaces verts, élagage, nettoyage, location mini-pelle, peinture, transport
- Équipe terrain: Jean-Pierre, Rodrigue, Mickaël, Fabrice

TU PEUX AIDER AVEC:
- Planning hebdomadaire des 4 employés
- Rédaction messages WhatsApp professionnels
- Réponses aux avis Google
- Emails clients et relances
- Annonces de recrutement
- Courriers administratifs
- Comptes-rendus de chantier
- Conseils gestion quotidienne
- Tout document professionnel

COMPORTEMENT:
- Tu réponds en français, ton chaleureux et professionnel
- Tu ne te présentes QUE dans le premier message
- Tu génères directement le contenu demandé sans trop de questions
- Quand tu produis un document structuré (planning, courrier, annonce), tu le formates proprement pour pouvoir être exporté en PDF
- Pas d'emojis, pas de markdown gras
- Tu t'adaptes à la demande: court ou long selon le besoin
- Tu connais le contexte de Rosa et l'utilises naturellement`

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

function detectStructuredDoc(text: string): boolean {
  const upper = text.toUpperCase()
  const planningKeywords = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']
  const docKeywords = ['OBJET :', 'MADAME', 'MONSIEUR', 'CORDIALEMENT', 'COMPTE-RENDU', 'ANNONCE', 'POSTE :', 'PROFIL :']
  const hasPlanningDay = planningKeywords.filter(k => upper.includes(k)).length >= 2
  const hasDocStructure = docKeywords.some(k => upper.includes(k))
  const lineCount = text.split('\n').length
  return hasPlanningDay || hasDocStructure || lineCount >= 15
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
      isDocument: detectStructuredDoc(content.text),
    })
  } catch (error) {
    console.error('Zara API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
