'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Settings } from 'lucide-react'

const PRIMARY = '#C4607A'

function ReceiptIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8H8" />
      <path d="M16 12H8" />
      <path d="M12 16H8" />
    </svg>
  )
}

interface SidebarProps {
  clientSlug: string
  logoSrc: string
}

const NAV_ITEMS = [
  { key: 'dashboard', icon: Home, label: 'Accueil', href: (slug: string) => `/${slug}/dashboard` },
  { key: 'devis', icon: null, label: 'Mes devis', href: (slug: string) => `/${slug}/devis` },
  { key: 'settings', icon: Settings, label: 'Paramètres', href: (slug: string) => `/${slug}/settings` },
]

export default function Sidebar({ clientSlug, logoSrc }: SidebarProps) {
  const pathname = usePathname()

  function isActive(key: string) {
    return pathname.includes(`/${key}`)
  }

  return (
    <aside
      className="flex flex-col items-center py-6 gap-8 flex-shrink-0"
      style={{ width: '60px', backgroundColor: '#0A0A0A', borderRight: '1px solid #1a1a1a' }}
    >
      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt="Logo"
        width={36}
        height={36}
        className="rounded-full object-cover flex-shrink-0"
      />

      {/* Nav icons */}
      <nav className="flex flex-col items-center gap-6 mt-2">
        {NAV_ITEMS.map(({ key, icon: Icon, label, href }) => {
          const active = isActive(key)
          const color = active ? PRIMARY : '#555'

          return (
            <Link
              key={key}
              href={href(clientSlug)}
              title={label}
              className="relative group transition-colors"
              style={{ color }}
            >
              {key === 'devis' ? (
                <ReceiptIcon size={20} />
              ) : Icon ? (
                <Icon size={20} />
              ) : null}

              {/* Tooltip */}
              <span
                className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
