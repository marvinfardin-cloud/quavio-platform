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

// Extract a euro amount from a single line: "TOTAL HT: 1 500,00 €"
// Finds the label, then grabs the first number on THAT line only.
function parseAmount(text: string, label: string): number {
  const re = new RegExp(label + '[^\\d\\n]*([\\d][\\d.,]*(?: [\\d]{3})*)', 'i')
  const m = text.match(re)
  if (!m) return 0
  const cleaned = m[1].replace(/\s/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

function parseDevis(text: string) {
  if (!text.includes('CLIENT:') || !text.includes('TOTAL TTC:')) return null

  try {
    const clientMatch = text.match(/CLIENT:\s*(.+)/)
    const adresseMatch = text.match(/ADRESSE:\s*(.+)/)

    const totalHT  = parseAmount(text, 'TOTAL HT')
    const tva      = parseAmount(text, 'TVA 8[.,]5%')
    const totalTTC = parseAmount(text, 'TOTAL TTC')

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

    // Fallback: if regex parsing yielded suspicious values, compute from services
    const sumHT = Math.round(services.reduce((acc, s) => acc + s.total, 0) * 100) / 100
    const finalHT  = totalHT  > sumHT * 0.5 ? totalHT  : sumHT
    const finalTva = tva      > 0            ? tva      : Math.round(finalHT * 0.085 * 100) / 100
    const finalTTC = totalTTC > finalHT      ? totalTTC : Math.round((finalHT + finalTva) * 100) / 100

    console.log('[Isaac] devis — sumHT:', sumHT, 'finalHT:', finalHT, 'tva:', finalTva, 'totalTTC:', finalTTC)

    return {
      clientName: clientMatch?.[1]?.trim() ?? 'Client',
      clientAddress: adresseMatch?.[1]?.trim() ?? '',
      services,
      totalHT:  finalHT,
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
