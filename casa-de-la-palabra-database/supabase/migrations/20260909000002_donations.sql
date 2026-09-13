-- Casa de la Palabra — donation transaction log.
-- casa_donation_methods (from 20260908000002) describes which payment
-- methods are shown and active; this table records the actual attempts,
-- currently only written by the 'card' (Culqi) flow's server route.
-- The donor is anonymous (no login required to donate), so inserts come
-- from the web app's server route using the anon key — RLS below allows
-- an insert of a well-formed row but no client can read, update or delete.

create table casa_donations (
  id uuid primary key default gen_random_uuid(),
  method text not null default 'card' check (method in ('card')),
  amount_cents integer not null check (amount_cents >= 300 and amount_cents <= 100000000),
  currency text not null default 'USD',
  donor_name text,
  donor_email text,
  culqi_charge_id text,
  status text not null check (status in ('succeeded', 'failed')),
  failure_message text,
  created_at timestamptz not null default now()
);

create index casa_donations_created_idx on casa_donations (created_at desc);

alter table casa_donations enable row level security;

create policy "casa_donations_insert_result" on casa_donations
  for insert with check (true);

create policy "casa_donations_staff_read" on casa_donations
  for select using (casa_is_staff());

-- No update/delete policy: a donation record, once written by the server
-- route with its final status, is immutable from the client.
