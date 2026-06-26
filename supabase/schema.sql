create extension if not exists pgcrypto;

create table if not exists public.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('ENTRADA', 'SAIDA')),
  descricao text not null check (char_length(descricao) between 1 and 120),
  categoria text not null check (char_length(categoria) between 1 and 60),
  valor numeric(14, 2) not null check (valor > 0),
  data date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists movimentacoes_user_data_idx
  on public.movimentacoes (user_id, data desc, created_at desc);

alter table public.movimentacoes enable row level security;

grant select, insert, update, delete on public.movimentacoes to authenticated;

drop policy if exists "Usuarios visualizam suas movimentacoes" on public.movimentacoes;
create policy "Usuarios visualizam suas movimentacoes"
  on public.movimentacoes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Usuarios criam suas movimentacoes" on public.movimentacoes;
create policy "Usuarios criam suas movimentacoes"
  on public.movimentacoes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuarios alteram suas movimentacoes" on public.movimentacoes;
create policy "Usuarios alteram suas movimentacoes"
  on public.movimentacoes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuarios excluem suas movimentacoes" on public.movimentacoes;
create policy "Usuarios excluem suas movimentacoes"
  on public.movimentacoes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
