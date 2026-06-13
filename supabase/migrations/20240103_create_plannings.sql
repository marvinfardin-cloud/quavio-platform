create table if not exists plannings (
  id uuid default gen_random_uuid() primary key,
  client_slug text not null,
  month integer not null,
  year integer not null,
  planning_data jsonb not null default '{}',
  pdf_base64 text,
  created_at timestamptz default now()
);

create index if not exists plannings_client_slug_idx on plannings(client_slug);
create index if not exists plannings_year_month_idx on plannings(year, month);
