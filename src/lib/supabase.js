import { createClient } from '@supabase/supabase-js'

// Cole suas credenciais do Supabase aqui
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/*
======================================================
  COLE ESTE SQL NO SUPABASE → SQL Editor → New Query
======================================================

-- Tabela de registros de produção
create table registros (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data date not null,
  tipo_producao text not null,
  procedimento_custom text,
  paciente_nome text,
  paciente_dob date,
  paciente_idade integer,
  convenio text,
  local_atendimento text,
  local_custom text,
  valor numeric(10,2),
  pago boolean default false,
  latitude numeric(10,7),
  longitude numeric(10,7),
  observacoes text,
  created_at timestamptz default now()
);

-- Tabela de locais personalizados
create table locais_custom (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  created_at timestamptz default now()
);

-- Habilitar RLS (segurança por usuário)
alter table registros enable row level security;
alter table locais_custom enable row level security;

-- Políticas: cada usuário só acessa os próprios dados
create policy "Usuário vê seus registros" on registros
  for all using (auth.uid() = user_id);

create policy "Usuário vê seus locais" on locais_custom
  for all using (auth.uid() = user_id);

======================================================
*/
