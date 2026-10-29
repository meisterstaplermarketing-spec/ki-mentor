-- Gemeinsames Lernen für die Stapler-KI.
-- Bereits eingerichtet im Supabase-Projekt „Stapler-Akademie“ (pfmnlfnjophvoboxgavs),
-- die App ist damit vorkonfiguriert. Nur für ein anderes Projekt erneut im SQL-Editor ausführen.
-- Gespeichert werden nur Lern-Ereignisse (Feedback, Gesprächssignale, neues Wissen, Dokumente, offene Fragen) –
-- es wird kein externer KI-Dienst verwendet.

create table if not exists public.stapler_events (
  id         text primary key,
  ts         bigint not null,
  type       text   not null,  -- feedback, implicit, alias, teach, document, forget, open, dismiss
  event      jsonb  not null,
  created_at timestamptz not null default now(),
  constraint stapler_events_size check (pg_column_size(event) < 2000000)
);

create index if not exists stapler_events_ts_idx on public.stapler_events (ts);

alter table public.stapler_events enable row level security;

-- Jeder mit dem Anon Key darf lesen und neue Ereignisse anhängen,
-- aber nichts ändern oder löschen (Append-only-Log).
drop policy if exists "stapler_events lesen" on public.stapler_events;
create policy "stapler_events lesen" on public.stapler_events
  for select to anon, authenticated using (true);

drop policy if exists "stapler_events anhaengen" on public.stapler_events;
create policy "stapler_events anhaengen" on public.stapler_events
  for insert to anon, authenticated with check (true);
