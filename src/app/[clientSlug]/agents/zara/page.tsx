import { redirect } from 'next/navigation'
import { getClientConfig } from '@/lib/clients'
import ZaraChat from '@/components/agents/ZaraChat'

export default async function ZaraPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const client = await getClientConfig(clientSlug)
  if (!client) redirect('/')

  return <ZaraChat client={client} userId="" />
}
