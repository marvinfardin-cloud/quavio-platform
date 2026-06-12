import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const ISAAC_SYSTEM = `Tu es Isaac, assistant devis pour ROSA EXCAVATOR - RENTAL AND SERVICE (travaux d'excavation et terrassement en Martinique).

Comportement :
- Présente-toi uniquement dans le tout premier message. Jamais après.
- Pas de markdown gras (**texte**), pas d'emojis.
- Ton de collègue, naturel et direct.
- Maximum 2 questions à la fois.
- Dès que tu as les infos nécessaires, génère le devis immédiatement sans demander confirmation.
- Si Rosa donne toutes les infos en une seule fois, génère le devis directement.

Infos requises : nom client, adresse chantier, prestations + quantités.

Format de devis obligatoire (texte brut, pas de bloc de code) :

CLIENT: [nom complet]
ADRESSE: [adresse chantier]
PRESTATIONS:
- [désignation] | [quantité] [unité] | [prix unitaire HT] €
TOTAL HT: [montant] €
TVA 8.5%: [montant] €
TOTAL TTC: [montant] €

TVA : 8.5% (Martinique). Calcule les totaux. Réponds en français.`


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

interface CompanyConfig {
  companyName?: string
  slogan?: string
  siret?: string
  tva?: string
  address?: string
  phone?: string
  email?: string
  servicesAndRates?: string
  additionalInfo?: string
}

function buildSystemPrompt(companyConfig: CompanyConfig | null): string {
  if (!companyConfig) return ISAAC_SYSTEM

  const parts: string[] = []
  if (companyConfig.companyName) parts.push(`Entreprise : ${companyConfig.companyName}`)
  if (companyConfig.slogan) parts.push(`Slogan : ${companyConfig.slogan}`)
  if (companyConfig.siret) parts.push(`SIRET : ${companyConfig.siret}`)
  if (companyConfig.tva) parts.push(`N° TVA : ${companyConfig.tva}`)
  if (companyConfig.address) parts.push(`Adresse : ${companyConfig.address}`)
  if (companyConfig.phone) parts.push(`Téléphone : ${companyConfig.phone}`)
  if (companyConfig.email) parts.push(`Email : ${companyConfig.email}`)
  if (companyConfig.servicesAndRates) parts.push(`\nTarifs et services :\n${companyConfig.servicesAndRates}`)
  if (companyConfig.additionalInfo) parts.push(`\nInformations complémentaires :\n${companyConfig.additionalInfo}`)

  if (!parts.length) return ISAAC_SYSTEM

  return `${ISAAC_SYSTEM}\n\n--- CONFIGURATION ENTREPRISE ---\n${parts.join('\n')}`
}

export async function POST(req: NextRequest) {
  try {
    const { messages, companyConfig } = await req.json()

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(companyConfig ?? null),
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
