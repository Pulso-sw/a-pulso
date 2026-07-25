-- ============================================================
-- A Pulso — script de configuração do Supabase
-- Rode isso em: Supabase → seu projeto → SQL Editor → New query
-- ============================================================

-- Tabela de perfis (complementa o login do Supabase Auth com nome, cargo e empresa)
create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  -- Todo mundo que se cadastra nesta instância pertence à mesma empresa.
  -- Se um dia você precisar atender várias empresas no mesmo projeto,
  -- troque esse default por um fluxo real de "criar/entrar em empresa".
  empresa_id uuid not null default '00000000-0000-0000-0000-000000000001',
  nome text not null,
  cargo text not null check (cargo in ('admin', 'colaborador')),
  criado_em timestamptz not null default now()
);

-- Tabela de registros de ponto (entrada/saída)
create table if not exists registros_ponto (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida')),
  criado_em timestamptz not null default now()
);

alter table perfis enable row level security;
alter table registros_ponto enable row level security;

-- Qualquer pessoa logada pode ver os perfis (times pequenos, ok para o MVP)
create policy "perfis visiveis para logados"
  on perfis for select
  to authenticated
  using (true);

-- Cada pessoa cria o próprio perfil no primeiro login
create policy "usuario cria o proprio perfil"
  on perfis for insert
  to authenticated
  with check (auth.uid() = id);

-- Cada colaborador só registra ponto para si mesmo
create policy "usuario bate o proprio ponto"
  on registros_ponto for insert
  to authenticated
  with check (auth.uid() = usuario_id);

-- Colaborador vê os próprios registros; admin vê os da empresa toda
create policy "ver registros proprios ou da empresa (admin)"
  on registros_ponto for select
  to authenticated
  using (
    usuario_id = auth.uid()
    or exists (
      select 1 from perfis admin_check
      join perfis dono on dono.id = registros_ponto.usuario_id
      where admin_check.id = auth.uid()
        and admin_check.cargo = 'admin'
        and admin_check.empresa_id = dono.empresa_id
    )
  );
