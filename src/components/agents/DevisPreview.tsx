'use client'

import { useState } from 'react'
import { DevisData, ClientConfig } from '@/types'
import { Download, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DevisPreviewProps {
  devis: DevisData
  client: ClientConfig
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

interface CompanyConfig {
  company_name: string | null
  slogan: string | null
  siret: string | null
  tva_number: string | null
  address: string | null
  tel: string | null
  email: string | null
}

const FALLBACK: CompanyConfig = {
  company_name: 'Rosa Excavator — Rental and Service',
  slogan: "Avec ROSA, chaque projet est guidé par la passion de l'embellissement extérieur",
  siret: '952 827 186 00018',
  tva_number: 'FR16 952 827 186',
  address: '533 Chemin Savane Dédé, 97232 Le Lamentin',
  tel: '+596 696 34 31 21',
  email: 'contact@rosaexcavator.com',
}

async function buildPdfDoc(devis: DevisData, client: ClientConfig, devisNum: string, company: CompanyConfig) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const [pr, pg, pb] = hexToRgb(client.primaryColor)
  const date = new Date().toLocaleDateString('fr-FR')

  // Collapse multiline fields to single line (textarea may contain \n)
  const oneLine = (s: string) => s.replace(/\s*\n\s*/g, ', ').trim()

  const co = {
    company_name: oneLine(company.company_name || FALLBACK.company_name!),
    slogan: oneLine(company.slogan || FALLBACK.slogan!),
    siret: oneLine(company.siret || FALLBACK.siret!),
    tva_number: oneLine(company.tva_number || FALLBACK.tva_number!),
    address: oneLine(company.address || FALLBACK.address!),
    tel: oneLine(company.tel || FALLBACK.tel!),
    email: oneLine(company.email || FALLBACK.email!),
  }

  // ── Load logo ────────────────────────────────────────────────
  let logoDataUrl: string | null = null
  try {
    const res = await fetch('/agents/rosa_logo.png')
    if (res.ok) {
      const blob = await res.blob()
      logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    }
  } catch {}

  // ── Header band ──────────────────────────────────────────────
  doc.setFillColor(pr, pg, pb)
  doc.rect(0, 0, 210, 60, 'F')

  if (logoDataUrl) {
    const logoX = 10
    const logoY = 8
    const logoSize = 25
    const radius = logoSize / 2
    // White circle background for the logo
    doc.setFillColor(255, 255, 255)
    doc.circle(logoX + radius, logoY + radius, radius, 'F')
    doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize)
  }

  const textX = logoDataUrl ? 48 : 14
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(co.company_name, textX, 20)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.text(co.slogan, textX, 29)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(co.address, textX, 38)
  doc.text(`Tél : ${co.tel}   |   ${co.email}`, textX, 46)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`Devis N° ${devisNum}`, 196, 22, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Date : ${date}`, 196, 31, { align: 'right' })

  // ── Client block ─────────────────────────────────────────────
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(248, 248, 248)
  doc.rect(120, 67, 76, 28, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('CLIENT', 124, 75)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(devis.clientName, 124, 82)
  if (devis.clientAddress) {
    doc.text(doc.splitTextToSize(devis.clientAddress, 68), 124, 89)
  }

  // ── Table ────────────────────────────────────────────────────
  const tableTop = 105
  const cols = { desc: 14, qty: 112, unit: 130, pu: 150, total: 175 }

  doc.setFillColor(pr, pg, pb)
  doc.rect(14, tableTop, 182, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('Désignation', cols.desc + 2, tableTop + 5.5)
  doc.text('Qté', cols.qty, tableTop + 5.5)
  doc.text('Unité', cols.unit, tableTop + 5.5)
  doc.text('PU HT', cols.pu, tableTop + 5.5)
  doc.text('Total HT', cols.total, tableTop + 5.5)

  let y = tableTop + 14
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)

  devis.services.forEach((svc, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(14, y - 5.5, 182, 9, 'F')
    }
    doc.text(doc.splitTextToSize(svc.description, 94)[0], cols.desc + 2, y)
    doc.text(String(svc.quantity), cols.qty, y)
    doc.text(svc.unit, cols.unit, y)
    doc.text(`${svc.unitPrice.toFixed(2)} €`, cols.pu, y)
    doc.text(`${svc.total.toFixed(2)} €`, cols.total, y)
    y += 10
  })

  // ── Totals ───────────────────────────────────────────────────
  y += 4
  doc.setDrawColor(220, 220, 220)
  doc.line(130, y, 196, y)
  y += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Total HT', 132, y)
  doc.text(`${devis.totalHT.toFixed(2)} €`, 196, y, { align: 'right' })
  y += 7
  doc.text('TVA 8,5%', 132, y)
  doc.text(`${devis.tva.toFixed(2)} €`, 196, y, { align: 'right' })
  y += 3

  doc.setFillColor(pr, pg, pb)
  doc.rect(128, y, 68, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.text('Total TTC', 132, y + 7)
  doc.text(`${devis.totalTTC.toFixed(2)} €`, 193, y + 7, { align: 'right' })

  // ── Footer ───────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220)
  doc.line(14, 274, 196, 274)
  doc.setTextColor(153, 153, 153)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const footerLine1Parts = [co.company_name.toUpperCase()]
  if (co.siret) footerLine1Parts.push(`SIRET : ${co.siret}`)
  if (co.tva_number) footerLine1Parts.push(`N° TVA : ${co.tva_number}`)
  doc.text(footerLine1Parts.join('  |  '), 105, 281, { align: 'center' })
  doc.text('Devis valable 30 jours  |  Acompte 30% à la commande', 105, 287, { align: 'center' })

  return doc
}

export default function DevisPreview({ devis, client }: DevisPreviewProps) {
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [clientEmail, setClientEmail] = useState('')
  const [lastDevisNum, setLastDevisNum] = useState('')

  async function downloadPDF() {
    const devisNum = `DEV-${Date.now().toString().slice(-6)}`
    setLastDevisNum(devisNum)

    // Fetch company config for dynamic header/footer
    let company: CompanyConfig = { ...FALLBACK }
    try {
      const res = await fetch(`/api/client-config?clientSlug=${client.slug}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) company = json.data
      }
    } catch {}

    const doc = await buildPdfDoc(devis, client, devisNum, company)
    const pdfBase64 = doc.output('datauristring')

    // Save to Supabase (fire-and-forget — don't block the download)
    try {
      const supabase = createClient()
      await supabase.from('devis').insert({
        client_slug: client.slug,
        client_name: devis.clientName,
        client_address: devis.clientAddress,
        total_ht: devis.totalHT,
        tva: devis.tva,
        total_ttc: devis.totalTTC,
        devis_number: devisNum,
        prestations: devis.services,
        pdf_data: pdfBase64,
      })
    } catch (e) {
      console.error('Failed to save devis:', e)
    }

    doc.save(`devis-rosa-${devis.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Client</p>
        <p className="text-white font-semibold">{devis.clientName}</p>
        {devis.clientAddress && (
          <p className="text-zinc-400 text-sm mt-0.5">{devis.clientAddress}</p>
        )}
      </div>

      <div>
        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Prestations</p>
        <div className="space-y-2">
          {devis.services.map((svc, i) => (
            <div key={i} className="bg-zinc-800 rounded-lg p-3">
              <p className="text-white text-sm font-medium">{svc.description}</p>
              <p className="text-zinc-400 text-xs mt-1">
                {svc.quantity} {svc.unit} × {svc.unitPrice.toFixed(2)} € ={' '}
                <span className="text-zinc-300 font-medium">{svc.total.toFixed(2)} €</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-4 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Total HT</span>
          <span className="text-white">{devis.totalHT.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">TVA 8,5%</span>
          <span className="text-white">{devis.tva.toFixed(2)} €</span>
        </div>
        <div
          className="flex justify-between font-bold rounded-lg px-3 py-2 mt-2"
          style={{ backgroundColor: client.primaryColor }}
        >
          <span className="text-white">Total TTC</span>
          <span className="text-white">{devis.totalTTC.toFixed(2)} €</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={downloadPDF}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: client.primaryColor }}
        >
          <Download size={16} />
          Télécharger le devis PDF
        </button>

        <button
          onClick={() => setShowEmailInput((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-opacity hover:opacity-80"
          style={{ border: `1.5px solid ${client.primaryColor}`, color: client.primaryColor, backgroundColor: 'transparent' }}
        >
          <Mail size={16} />
          Envoyer par email
        </button>

        {showEmailInput && (
          <div className="flex gap-2">
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Email du client"
              className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 text-sm"
              style={{ fontSize: '16px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendEmail()
              }}
              autoFocus
            />
            <button
              onClick={sendEmail}
              disabled={!clientEmail.trim()}
              className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: client.primaryColor }}
            >
              Envoyer
            </button>
          </div>
        )}
      </div>
    </div>
  )

  function sendEmail() {
    const num = lastDevisNum || `DEV-??????`
    const ttc = devis.totalTTC.toFixed(2).replace('.', ',')
    const subject = encodeURIComponent(`Devis ${num} - Rosa Excavator`)
    const body = encodeURIComponent(
      `Bonjour,\n\nVeuillez trouver ci-joint votre devis ${num}.\n\n` +
      `Montant TTC : ${ttc} €\n` +
      `Validité : 30 jours\n\n` +
      `Pour toute question, contactez-nous :\n` +
      `Tél : +596 696 34 31 21\n` +
      `Email : contact@rosaexcavator.com\n\n` +
      `Cordialement,\nRosa Excavator - Rental and Service`
    )
    window.location.href = `mailto:${clientEmail.trim()}?subject=${subject}&body=${body}`
  }
}
