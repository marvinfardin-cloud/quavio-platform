import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClientConfig } from '@/lib/clients'
import IsaacChat from '@/components/agents/IsaacChat'

export default async function IsaacPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/${clientSlug}/login`)

  const client = await getClientConfig(clientSlug)
  if (!client) redirect('/')

  return <IsaacChat client={client} userId={user.id} />
}
