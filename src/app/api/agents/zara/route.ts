import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const ZARA_SYSTEM = `Tu es Zara, assistante planning de Rosa Excavator.
Tu aides Rosa à organiser le planning hebdomadaire de ses 4 employés.
Rosa décrit les chantiers de la semaine et tu génères un planning clair.
Tu peux aussi générer le planning en format texte structuré.
Ton ton est professionnel et direct, comme une collègue.
Pas d'emojis, pas de markdown gras.`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: ZARA_SYSTEM,
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
