'use client'

import { DevisData, ClientConfig } from '@/types'
import { Download } from 'lucide-react'

interface DevisPreviewProps {
  devis: DevisData
  client: ClientConfig
}

export default function DevisPreview({ devis, client }: DevisPreviewProps) {
  async function downloadPDF() {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    // Header
    doc.setFillColor(client.primaryColor)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(client.name, 15, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('DEVIS', 15, 30)

    const date = new Date().toLocaleDateString('fr-FR')
    doc.text(`Date : ${date}`, 150, 20)
    doc.text(`N° : DEV-${Date.now().toString().slice(-6)}`, 150, 28)

    // Client info
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Client', 15, 55)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(devis.clientName, 15, 63)
    doc.text(devis.clientAddress, 15, 70)

    // Table header
    const tableY = 85
    doc.setFillColor(245, 245, 245)
    doc.rect(15, tableY, 180, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Prestation', 18, tableY + 5.5)
    doc.text('Qté', 110, tableY + 5.5)
    doc.text('Unité', 125, tableY + 5.5)
    doc.text('PU HT', 145, tableY + 5.5)
    doc.text('Total HT', 165, tableY + 5.5)

    // Table rows
    let y = tableY + 14
    doc.setFont('helvetica', 'normal')
    devis.services.forEach((service, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(252, 252, 252)
        doc.rect(15, y - 5, 180, 8, 'F')
      }
      doc.text(service.description.substring(0, 50), 18, y)
      doc.text(String(service.quantity), 110, y)
      doc.text(service.unit, 125, y)
      doc.text(`${service.unitPrice} €`, 145, y)
      doc.text(`${service.total} €`, 165, y)
      y += 10
    })

    // Totals
    y += 5
    doc.setDrawColor(200, 200, 200)
    doc.line(120, y, 195, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.text('Total HT', 120, y)
    doc.text(`${devis.totalHT} €`, 170, y, { align: 'right' })
    y += 7
    doc.text('TVA 20%', 120, y)
    doc.text(`${devis.tva} €`, 170, y, { align: 'right' })
    y += 7

    doc.setFillColor(client.primaryColor)
    doc.rect(115, y - 5, 80, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('Total TTC', 120, y + 1.5)
    doc.text(`${devis.totalTTC} €`, 190, y + 1.5, { align: 'right' })

    // Footer
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Devis valable 30 jours. Merci de votre confiance.', 105, 280, { align: 'center' })

    doc.save(`devis-${devis.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <p className="text-zinc-400 text-xs uppercase tracking-wider">Client</p>
        <p className="text-white font-medium">{devis.clientName}</p>
        <p className="text-zinc-400 text-sm">{devis.clientAddress}</p>
      </div>

      <div className="space-y-2">
        <p className="text-zinc-400 text-xs uppercase tracking-wider">Prestations</p>
        <div className="space-y-2">
          {devis.services.map((service, i) => (
            <div key={i} className="bg-zinc-900 rounded-lg p-3">
              <p className="text-white text-sm font-medium">{service.description}</p>
              <p className="text-zinc-400 text-xs mt-1">
                {service.quantity} {service.unit} × {service.unitPrice} € = {service.total} €
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Total HT</span>
          <span className="text-white">{devis.totalHT} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">TVA 20%</span>
          <span className="text-white">{devis.tva} €</span>
        </div>
        <div
          className="flex justify-between font-bold rounded-lg px-3 py-2 mt-2"
          style={{ backgroundColor: client.primaryColor }}
        >
          <span className="text-white">Total TTC</span>
          <span className="text-white">{devis.totalTTC} €</span>
        </div>
      </div>

      <button
        onClick={downloadPDF}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
        style={{ backgroundColor: client.primaryColor }}
      >
        <Download size={16} />
        Télécharger le PDF
      </button>
    </div>
  )
}
