'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SetupBanner({ clientSlug }: { clientSlug: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data } = await supabase
        .from('client_config')
        .select('company_name, services_pricing')
        .eq('client_slug', clientSlug)
        .single()

      if (!data || (!data.company_name && !data.services_pricing)) {
        setShow(true)
      }
    }
    check()
  }, [clientSlug])

  if (!show) return null

  return (
    <div
      className="max-w-3xl mx-auto w-full mb-6 flex items-center justify-between gap-4 rounded-xl px-5 py-3.5"
      style={{ backgroundColor: '#1a0f12', border: '1px solid #3a1f28' }}
    >
      <Link
        href={`/${clientSlug}/settings`}
        className="flex items-center gap-2 text-sm font-medium hover:opacity-90 transition-opacity"
        style={{ color: '#C4607A' }}
      >
        Configurez votre espace pour personnaliser vos agents
        <ArrowRight size={15} />
      </Link>
      <button
        onClick={() => setShow(false)}
        className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0"
      >
        <X size={15} />
      </button>
    </div>
  )
}
