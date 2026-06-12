'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/dashboard/Sidebar'

interface Config {
  companyName: string
  slogan: string
  siret: string
  tvaNumber: string
  address: string
  tel: string
  email: string
  servicesPricing: string
  additionalContext: string
}

const EMPTY: Config = {
  companyName: '', slogan: '', siret: '', tvaNumber: '',
  address: '', tel: '', email: '', servicesPricing: '', additionalContext: '',
}

export default function SettingsPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const router = useRouter()
  const [config, setConfig] = useState<Config>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('client_config')
        .select('*')
        .eq('client_slug', clientSlug)
        .single()

      if (data) {
        setConfig({
          companyName: data.company_name ?? '',
          slogan: data.slogan ?? '',
          siret: data.siret ?? '',
          tvaNumber: data.tva_number ?? '',
          address: data.address ?? '',
          tel: data.tel ?? '',
          email: data.email ?? '',
          servicesPricing: data.services_pricing ?? '',
          additionalContext: data.additional_context ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [clientSlug])

  function set(field: keyof Config, value: string) {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('client_config').upsert({
        client_slug: clientSlug,
        company_name: config.companyName,
        slogan: config.slogan,
        siret: config.siret,
        tva_number: config.tvaNumber,
        address: config.address,
        tel: config.tel,
        email: config.email,
        services_pricing: config.servicesPricing,
        additional_context: config.additionalContext,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_slug' })

      if (error) throw error

      setSaved(true)
      toast.success('Configuration sauvegardée')
      setTimeout(() => setSaved(false), 2500)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: '#0F0F0F', fontFamily: 'var(--font-space-grotesk)' }}
    >
      <Sidebar clientSlug={clientSlug} logoSrc="/rosa_logo.png" />
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div
          className="flex items-center gap-4 px-8 py-5 border-b flex-shrink-0"
          style={{ backgroundColor: '#0A0A0A', borderColor: '#1a1a1a' }}
        >
          <button
            onClick={() => router.push(`/${clientSlug}/dashboard`)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Settings size={20} style={{ color: '#C4607A' }} />
            <h1 className="text-white font-bold text-lg">Configuration</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-zinc-500 text-sm">Chargement...</p>
            </div>
          ) : (
            <form onSubmit={save} className="max-w-2xl mx-auto px-6 py-10 space-y-10">

              {/* INFORMATIONS ENTREPRISE */}
              <section>
                <h2 className="text-xs uppercase tracking-widest font-semibold mb-5" style={{ color: '#C4607A' }}>
                  Informations entreprise
                </h2>
                <div className="space-y-4">
                  <Field label="Nom de l'entreprise">
                    <input type="text" value={config.companyName}
                      onChange={(e) => set('companyName', e.target.value)}
                      placeholder="Rosa Excavator" className="ifield" />
                  </Field>
                  <Field label="Slogan">
                    <input type="text" value={config.slogan}
                      onChange={(e) => set('slogan', e.target.value)}
                      placeholder="Avec ROSA, chaque projet guidé par la passion..." className="ifield" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="SIRET">
                      <input type="text" value={config.siret}
                        onChange={(e) => set('siret', e.target.value)}
                        placeholder="952 827 186 00018" className="ifield" />
                    </Field>
                    <Field label="N° TVA">
                      <input type="text" value={config.tvaNumber}
                        onChange={(e) => set('tvaNumber', e.target.value)}
                        placeholder="FR16 952 827 186" className="ifield" />
                    </Field>
                  </div>
                  <Field label="Adresse">
                    <textarea value={config.address}
                      onChange={(e) => set('address', e.target.value)}
                      placeholder="533 Chemin Savane Dédé, 97232 Le Lamentin"
                      rows={2} className="ifield resize-none" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Téléphone">
                      <input type="text" value={config.tel}
                        onChange={(e) => set('tel', e.target.value)}
                        placeholder="+596 696 34 31 21" className="ifield" />
                    </Field>
                    <Field label="Email">
                      <input type="email" value={config.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="contact@rosaexcavator.com" className="ifield" />
                    </Field>
                  </div>
                </div>
              </section>

              {/* TARIFS ET SERVICES */}
              <section>
                <h2 className="text-xs uppercase tracking-widest font-semibold mb-5" style={{ color: '#C4607A' }}>
                  Tarifs et services
                </h2>
                <Field label="Décrivez vos services et tarifs">
                  <textarea value={config.servicesPricing}
                    onChange={(e) => set('servicesPricing', e.target.value)}
                    placeholder="Ex: Terrassement 12-18€/m², Élagage 80-200€/arbre, Location mini-pelle 350€/jour..."
                    rows={6} className="ifield resize-y" />
                </Field>
              </section>

              {/* INFORMATIONS COMPLÉMENTAIRES */}
              <section>
                <h2 className="text-xs uppercase tracking-widest font-semibold mb-5" style={{ color: '#C4607A' }}>
                  Informations complémentaires
                </h2>
                <Field label="Autres infos utiles pour les agents">
                  <textarea value={config.additionalContext}
                    onChange={(e) => set('additionalContext', e.target.value)}
                    placeholder="Conditions de paiement, zones d'intervention, délais..."
                    rows={4} className="ifield resize-y" />
                </Field>
              </section>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#C4607A' }}
              >
                {saved ? <Check size={18} /> : null}
                {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder la configuration'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .ifield {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background-color: #1a1a1a;
          border: 1px solid #2a2a2a;
          color: white;
          font-size: 0.875rem;
          font-family: var(--font-space-grotesk);
          transition: border-color 0.15s;
          outline: none;
        }
        .ifield::placeholder { color: #444; }
        .ifield:focus { border-color: #C4607A; }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
