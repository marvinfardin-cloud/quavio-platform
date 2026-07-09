import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientSlug, ...fields } = body

    if (!clientSlug) {
      return NextResponse.json({ error: 'clientSlug required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin()
      .from('client_config')
      .upsert({
        client_slug: clientSlug,
        company_name: fields.company_name,
        slogan: fields.slogan,
        siret: fields.siret,
        tva_number: fields.tva_number,
        address: fields.address,
        tel: fields.tel,
        email: fields.email,
        services_pricing: fields.services_pricing,
        additional_context: fields.additional_context,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_slug' })

    if (error) {
      console.error('client-config upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('client-config route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
