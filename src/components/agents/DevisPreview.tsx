'use client'

import { DevisData, ClientConfig } from '@/types'
import { Download } from 'lucide-react'

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

export default function DevisPreview({ devis, client }: DevisPreviewProps) {
  async function downloadPDF() {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const [pr, pg, pb] = hexToRgb(client.primaryColor)
    const devisNum = `DEV-${Date.now().toString().slice(-6)}`
    const date = new Date().toLocaleDateString('fr-FR')

    // ── Header band ──────────────────────────────────────────────
    doc.setFillColor(pr, pg, pb)
    doc.rect(0, 0, 210, 45, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Rosa Excavator', 14, 18)

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.text('Avec ROSA, chaque projet est guidé par la passion', 14, 26)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Tél : +596 696 34 31 21', 14, 34)

    // Devis number & date — top right
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`Devis N° ${devisNum}`, 196, 18, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Date : ${date}`, 196, 26, { align: 'right' })

    // ── Client block ─────────────────────────────────────────────
    doc.setTextColor(0, 0, 0)
    doc.setFillColor(248, 248, 248)
    doc.rect(120, 52, 76, 28, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('CLIENT', 124, 60)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(devis.clientName, 124, 67)
    if (devis.clientAddress) {
      const addrLines = doc.splitTextToSize(devis.clientAddress, 68)
      doc.text(addrLines, 124, 74)
    }

    // ── Table ────────────────────────────────────────────────────
    const tableTop = 90
    const cols = { desc: 14, qty: 112, unit: 130, pu: 150, total: 175 }

    // Table header
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

    // Table rows
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
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.text(
      'Devis valable 30 jours — Acompte 30% à la commande',
      105,
      284,
      { align: 'center' }
    )

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

      <button
        onClick={downloadPDF}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
        style={{ backgroundColor: client.primaryColor }}
      >
        <Download size={16} />
        Télécharger le devis PDF
      </button>
    </div>
  )
}
