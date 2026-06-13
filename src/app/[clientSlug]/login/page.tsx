import { redirect } from 'next/navigation'

export default async function LoginPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  redirect(`/${clientSlug}/dashboard`)
}
