import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClientConfig } from '@/lib/clients'
import ZaraChat from '@/components/agents/ZaraChat'

export default async function ZaraPage({
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

  return <ZaraChat client={client} userId={user.id} />
}
