import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const ISAAC_SYSTEM = `Tu es Isaac, un assistant expert en création de devis pour ROSA Aménagement, une entreprise d'aménagement paysager.

Ton rôle : extraire les informations d'une description de chantier et générer un devis structuré.

Quand l'utilisateur décrit un chantier, tu dois :
1. D'abord poser des questions pour clarifier les informations manquantes (nom client, adresse, détail des prestations, quantités)
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
    "tva": 90,
    "totalTTC": 540
  }
}
\`\`\`

Le taux de TVA est 20%. Calcule automatiquement les totaux.
Sois précis, professionnel et aide l'utilisateur à ne rien oublier.
Réponds toujours en français.`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: ISAAC_SYSTEM,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    // Try to extract JSON devis from response
    const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/)
    let devisData = null
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        devisData = parsed.devis || null
      } catch {}
    }

    return NextResponse.json({
      message: content.text,
      devis: devisData,
    })
  } catch (error) {
    console.error('Isaac API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
