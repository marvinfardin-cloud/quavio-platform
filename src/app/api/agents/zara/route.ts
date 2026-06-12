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

const ZARA_SYSTEM = `Tu es Zara, assistante planning de Rosa Excavator.
Tu aides Rosa à organiser le planning hebdomadaire de ses 4 employés.
Rosa décrit les chantiers de la semaine et tu génères un planning clair.
Tu peux aussi générer le planning en format texte structuré.
Ton ton est professionnel et direct, comme une collègue.
Pas d'emojis, pas de markdown gras.`

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
    return `${ZARA_SYSTEM}\n\n--- CONFIGURATION ENTREPRISE ---\n${parts.join('\n')}`
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
      max_tokens: 1024,
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

    return NextResponse.json({ message: content.text })
  } catch (error) {
    console.error('Zara API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
