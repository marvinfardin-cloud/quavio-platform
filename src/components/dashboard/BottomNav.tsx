'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Settings } from 'lucide-react'

const PRIMARY = '#C4607A'

function ReceiptIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8H8" /><path d="M16 12H8" /><path d="M12 16H8" />
    </svg>
  )
}

const NAV_ITEMS = [
  { key: 'dashboard', icon: Home, label: 'Accueil', href: (slug: string) => `/${slug}/dashboard` },
  { key: 'devis', icon: null, label: 'Devis', href: (slug: string) => `/${slug}/devis` },
  { key: 'settings', icon: Settings, label: 'Réglages', href: (slug: string) => `/${slug}/settings` },
]

export default function BottomNav({ clientSlug }: { clientSlug: string }) {
  const pathname = usePathname()

  function isActive(key: string) {
    return pathname.includes(`/${key}`)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t z-50 lg:hidden"
      style={{
        backgroundColor: '#0A0A0A',
        borderColor: '#1a1a1a',
        height: '64px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV_ITEMS.map(({ key, icon: Icon, label, href }) => {
        const active = isActive(key)
        return (
          <Link
            key={key}
            href={href(clientSlug)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px]"
            style={{ color: active ? PRIMARY : '#555' }}
          >
            {key === 'devis' ? <ReceiptIcon size={22} /> : Icon ? <Icon size={22} /> : null}
            <span className="text-xs font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
