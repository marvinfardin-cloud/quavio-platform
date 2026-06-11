import { notFound } from 'next/navigation'
import { getClientConfig } from '@/lib/clients'

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const client = await getClientConfig(clientSlug)

  if (!client) notFound()

  return (
    <div
      style={
        {
          '--primary': client.primaryColor,
          '--bg': client.backgroundColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
