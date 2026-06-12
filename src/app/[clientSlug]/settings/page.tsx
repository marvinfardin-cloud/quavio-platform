'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { QuavioConfig, DEFAULT_CONFIG, getStorageKey, loadConfig } from '@/lib/quavioConfig'
import Sidebar from '@/components/dashboard/Sidebar'

export default function SettingsPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const router = useRouter()
  const [config, setConfig] = useState<QuavioConfig>(DEFAULT_CONFIG)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setConfig(loadConfig(clientSlug))
  }, [clientSlug])

  function set(field: keyof QuavioConfig, value: string) {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem(getStorageKey(clientSlug), JSON.stringify(config))
    setSaved(true)
    toast.success('Configuration sauvegardée')
    setTimeout(() => setSaved(false), 2500)
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
      <form onSubmit={save} className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* INFORMATIONS ENTREPRISE */}
        <section>
          <h2 className="text-xs uppercase tracking-widest font-semibold mb-5" style={{ color: '#C4607A' }}>
            Informations entreprise
          </h2>
          <div className="space-y-4">
            <Field label="Nom de l'entreprise">
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                placeholder="Rosa Excavator"
                className="input-field"
              />
            </Field>
            <Field label="Slogan">
              <input
                type="text"
                value={config.slogan}
                onChange={(e) => set('slogan', e.target.value)}
                placeholder="Avec ROSA, chaque projet est guidé par la passion de l'embellissement extérieur"
                className="input-field"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="SIRET">
                <input
                  type="text"
                  value={config.siret}
                  onChange={(e) => set('siret', e.target.value)}
                  placeholder="952 827 186 00018"
                  className="input-field"
                />
              </Field>
              <Field label="N° TVA">
                <input
                  type="text"
                  value={config.tva}
                  onChange={(e) => set('tva', e.target.value)}
                  placeholder="FR16 952 827 186"
                  className="input-field"
                />
              </Field>
            </div>
            <Field label="Adresse">
              <textarea
                value={config.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="533 Chemin Savane Dédé, 97232 Le Lamentin"
                rows={2}
                className="input-field resize-none"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Téléphone">
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+596 696 34 31 21"
                  className="input-field"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="contact@rosaexcavator.com"
                  className="input-field"
                />
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
            <textarea
              value={config.servicesAndRates}
              onChange={(e) => set('servicesAndRates', e.target.value)}
              placeholder={"Ex: Terrassement 12-18€/m², Élagage 80-200€/arbre, Location mini-pelle 350€/jour..."}
              rows={6}
              className="input-field resize-y"
            />
          </Field>
        </section>

        {/* INFORMATIONS COMPLÉMENTAIRES */}
        <section>
          <h2 className="text-xs uppercase tracking-widest font-semibold mb-5" style={{ color: '#C4607A' }}>
            Informations complémentaires
          </h2>
          <Field label="Autres infos utiles pour l'agent">
            <textarea
              value={config.additionalInfo}
              onChange={(e) => set('additionalInfo', e.target.value)}
              placeholder={"Conditions de paiement, zones d'intervention, délais..."}
              rows={4}
              className="input-field resize-y"
            />
          </Field>
        </section>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#C4607A' }}
        >
          {saved ? <Check size={18} /> : null}
          {saved ? 'Sauvegardé !' : 'Sauvegarder la configuration'}
        </button>
      </form>

      <style jsx>{`
        .input-field {
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
        .input-field::placeholder {
          color: #444;
        }
        .input-field:focus {
          border-color: #C4607A;
        }
      `}</style>
      </div>
      </div>
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
