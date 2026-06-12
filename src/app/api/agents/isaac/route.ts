import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const ISAAC_SYSTEM = `Tu es Isaac, assistant devis pour Rosa Excavator, entreprise de travaux d'excavation et terrassement en Martinique.

Ton rôle : collecter les informations du chantier et produire un devis structuré.

Quand l'utilisateur décrit un chantier, pose les questions nécessaires pour obtenir :
- Nom et coordonnées du client
- Adresse du chantier
- Détail des prestations avec quantités

Une fois les infos complètes, génère le résumé du devis en suivant EXACTEMENT ce format (sans bloc de code, directement dans ta réponse) :

CLIENT: [nom complet]
ADRESSE: [adresse chantier]
PRESTATIONS:
- [désignation] | [quantité] [unité] | [prix unitaire HT] €
- [désignation] | [quantité] [unité] | [prix unitaire HT] €
TOTAL HT: [montant] €
TVA 8.5%: [montant] €
TOTAL TTC: [montant] €

TVA applicable : 8.5% (taux Martinique).
Calcule les totaux automatiquement.
Réponds toujours en français. Sois concis et professionnel.`


function parseDevis(text: string) {
  if (!text.includes('CLIENT:') || !text.includes('TOTAL TTC:')) return null

  try {
    const clientMatch = text.match(/CLIENT:\s*(.+)/)
    const adresseMatch = text.match(/ADRESSE:\s*(.+)/)


    const servicesSection = text.match(/PRESTATIONS:\n([\s\S]*?)(?:\nTOTAL HT:)/)
    const services: Array<{ description: string; quantity: number; unit: string; unitPrice: number; total: number }> = []

    if (servicesSection) {
      const lines = servicesSection[1].split('\n').filter((l) => l.trim().startsWith('-'))
      for (const line of lines) {
        const parts = line.replace(/^-\s*/, '').split('|').map((s) => s.trim())
        if (parts.length >= 3) {
          const description = parts[0]
          const qtyUnit = parts[1].split(' ')
          const quantity = parseFloat(qtyUnit[0].replace(',', '.')) || 1
          const unit = qtyUnit.slice(1).join(' ') || 'u'
          // unit price may be "1 500,00 €" — strip spaces, currency symbol
          const rawPrice = parts[2].replace(/[^\d,. ]/g, '').replace(/\s/g, '').replace(',', '.')
          const unitPrice = parseFloat(rawPrice) || 0
          const total = Math.round(quantity * unitPrice * 100) / 100
          services.push({ description, quantity, unit, unitPrice, total })
        }
      }
    }

    if (!services.length) return null

    // Always compute totals from the services array — this is the ground truth.
    // Parsed values from text are unreliable (regex can grab a line-item price).
    const sumHT  = Math.round(services.reduce((acc, s) => acc + s.total, 0) * 100) / 100
    const finalTva = Math.round(sumHT * 0.085 * 100) / 100
    const finalTTC = Math.round((sumHT + finalTva) * 100) / 100

    console.log('[Isaac] services:', services.map(s => s.total), 'sumHT:', sumHT, 'tva:', finalTva, 'TTC:', finalTTC)

    return {
      clientName: clientMatch?.[1]?.trim() ?? 'Client',
      clientAddress: adresseMatch?.[1]?.trim() ?? '',
      services,
      totalHT:  sumHT,
      tva:      finalTva,
      totalTTC: finalTTC,
    }
  } catch {
    return null
  }
}

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

    const devisData = parseDevis(content.text)

    return NextResponse.json({
      message: content.text,
      devis: devisData,
    })
  } catch (error) {
    console.error('Isaac API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
