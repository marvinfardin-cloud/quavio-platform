-- Migration: create client_config table for per-client agent configuration
create table if not exists client_config (
  id uuid default gen_random_uuid() primary key,
  client_slug text unique,
  company_name text,
  slogan text,
  siret text,
  tva_number text,
  address text,
  tel text,
  email text,
  services_pricing text,
  additional_context text,
  updated_at timestamptz default now()
);

create index if not exists client_config_slug_idx on client_config(client_slug);
