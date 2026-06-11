'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton({ clientSlug }: { clientSlug: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${clientSlug}/login`)
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
    >
      Déconnexion
    </button>
  )
}
