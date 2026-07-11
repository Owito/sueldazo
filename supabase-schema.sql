-- ============================================================
--  Sueldazo · Esquema de base de datos (Supabase / Postgres)
--  Pégalo en:  Supabase → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.salarios (
  id          bigint generated always as identity primary key,
  rol         text        not null,
  seniority   text        not null,
  pais        text        not null,
  modalidad   text        not null,
  experiencia integer     not null check (experiencia >= 0 and experiencia <= 60),
  salario     numeric     not null check (salario >= 0),
  moneda      text        not null,
  email       text        not null,
  created_at  timestamptz not null default now()
);

-- Activar Row Level Security
alter table public.salarios enable row level security;

-- Política 1: cualquiera (anon) puede INSERTAR su dato...
create policy "publico_puede_insertar"
  on public.salarios
  for insert
  to anon
  with check (true);

-- Política 2: ...pero NADIE puede leer los datos con la anon key.
-- (No creamos policy de SELECT para anon => las lecturas quedan bloqueadas.)
-- El contador de la landing usa count con head=true, que no expone filas.

-- Índice útil para el reporte comparativo por rol/seniority/país
create index if not exists idx_salarios_perfil
  on public.salarios (rol, seniority, pais);

-- Función segura para exponer SOLO el total (sin revelar filas).
-- security definer => corre con permisos del dueño y salta RLS,
-- pero devuelve únicamente un número.
create or replace function public.total_salarios()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from public.salarios;
$$;

grant execute on function public.total_salarios() to anon;
