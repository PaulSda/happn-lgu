-- ============================================================
--  happn x LGU — Schéma de la base de suivi des contenus
--  À coller dans Supabase : menu "SQL Editor" > "New query" > Run
-- ============================================================

create table if not exists public.contents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  format      text,
  pub_date    date,
  views       bigint,
  likes       bigint,
  comments    bigint,
  link        text,
  venue       text,
  photos      jsonb default '[]'::jsonb,
  created_at  timestamptz default now()
);

-- Active la lecture/écriture depuis l'app (clé anon)
alter table public.contents enable row level security;

-- Tout le monde avec le lien peut LIRE (happn en lecture temps réel)
create policy "lecture publique"
  on public.contents for select
  using (true);

-- Tout le monde avec le lien peut ÉCRIRE
-- (Si tu veux verrouiller l'écriture plus tard, on remplacera par un mot de passe.)
create policy "ecriture publique"
  on public.contents for insert
  with check (true);

create policy "suppression publique"
  on public.contents for delete
  using (true);

create policy "maj publique"
  on public.contents for update
  using (true);

-- Active le temps réel sur la table
alter publication supabase_realtime add table public.contents;
