import { redirect } from 'next/navigation'
import { getClientConfig } from '@/lib/clients'
import IsaacChat from '@/components/agents/IsaacChat'

export default async function IsaacPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const client = await getClientConfig(clientSlug)
  if (!client) redirect('/')

  return <IsaacChat client={client} userId="" />
}
