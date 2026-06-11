import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const ZARA_SYSTEM = `Tu es Zara, une assistante spécialisée en communication professionnelle pour ROSA Aménagement, une entreprise d'aménagement paysager.

Ton rôle : aider l'équipe ROSA à rédiger des réponses professionnelles, chaleureuses et efficaces aux messages de leurs clients.

Quand on te soumet un message client :
1. Analyse le ton, la demande et le contexte
2. Propose une réponse professionnelle qui :
   - Est chaleureuse et personnalisée
   - Répond précisément à la demande
   - Reflète l'image premium de ROSA Aménagement
   - Est concise et claire
3. Tu peux proposer 2-3 variantes si pertinent (ton formel / moins formel)
4. Ajoute des suggestions si des informations manquent dans le message client

Réponds toujours en français. Sois utile et efficace.`

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
