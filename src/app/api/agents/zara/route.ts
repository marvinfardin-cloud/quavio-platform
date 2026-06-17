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

const ZARA_SYSTEM = `IMPORTANT : Réponds TOUJOURS avec du JSON pur. Jamais de backticks. Jamais de markdown. Jamais de texte avant ou après le JSON.

Tu es Zara, assistante intelligente de Rosa Excavator.
Tu as trois modes de travail selon la demande de Catheline :

MODE PLANNING — si elle décrit des chantiers à organiser pour la semaine :
Génère UNIQUEMENT un JSON valide, sans texte avant ou après, sans markdown, sans backticks.
Format JSON strict :
{
  "mode": "planning",
  "semaine": "du [date lundi] au [date dimanche]",
  "planning": [
    {
      "jour": "Lundi",
      "date": "2026-06-16",
      "assignations": [
        { "employe": "Marcus Mathurin", "tache": "Description du chantier" },
        { "employe": "Nicky Antoine", "tache": "Description du chantier" }
      ]
    }
  ]
}
Inclus les 7 jours. Si un jour est vide : assignations: [].
3 employés : Marcus Mathurin, Nicky Antoine, William Joseph-Julien.

MODE RELANCE — si elle veut relancer un client (devis sans réponse, RDV à confirmer) :
Génère UNIQUEMENT un JSON valide :
{
  "mode": "relance",
  "messages": [
    {
      "canal": "WhatsApp",
      "destinataire": "[nom client]",
      "message": "[message de relance professionnel, chaleureux, court, sans emoji]"
    }
  ]
}

MODE COMMUNICATION — si elle colle un message client reçu et veut une réponse :
Génère UNIQUEMENT un JSON valide :
{
  "mode": "communication",
  "variantes": [
    { "ton": "formel", "message": "[réponse professionnelle]" },
    { "ton": "chaleureux", "message": "[réponse plus détendue]" }
  ]
}

RÈGLES GLOBALES :
- Détecte automatiquement le mode selon la demande
- Si informations manquantes, pose UNE seule question ciblée
- Pas d'emojis. Pas de markdown. JSON pur uniquement.
- Langue : français
- Ton professionnel et direct`

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

    const responseText = content.text.trim()

    const extractJSON = (text: string) => {
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      try {
        return JSON.parse(cleaned)
      } catch {
        const match = text.match(/\{[\s\S]*\}/)
        if (match) {
          try { return JSON.parse(match[0]) } catch { return null }
        }
        return null
      }
    }

    const parsed = extractJSON(responseText)
    if (parsed && typeof parsed === 'object' && 'mode' in parsed) {
      if (parsed.mode === 'planning') return NextResponse.json({ planning: parsed })
      if (parsed.mode === 'relance') return NextResponse.json({ relance: parsed })
      if (parsed.mode === 'communication') return NextResponse.json({ communication: parsed })
    }

    return NextResponse.json({ message: responseText })
  } catch (error) {
    console.error('Zara API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
