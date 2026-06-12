-- Migration: create devis history table
create table if not exists devis (
  id uuid primary key default gen_random_uuid(),
  client_slug text not null,
  client_name text not null,
  client_address text,
  total_ht decimal(10,2) not null,
  tva decimal(10,2) not null,
  total_ttc decimal(10,2) not null,
  devis_number text not null,
  prestations jsonb not null default '[]',
  pdf_data text,
  created_at timestamptz not null default now()
);

create index if not exists devis_client_slug_idx on devis(client_slug);
create index if not exists devis_created_at_idx on devis(created_at desc);
