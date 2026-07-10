-- ============================================================
-- VERYSING - Esquema completo do banco (Supabase / PostgreSQL)
-- Script IDEMPOTENTE: pode rodar quantas vezes quiser sem
-- apagar dados. Rode no SQL Editor do painel do Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- USUÁRIOS
-- ------------------------------------------------------------
create table if not exists public.usuarios (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text not null unique,
    cpf text unique,
    senha_hash text not null,
    tipo_plano text default 'gratuito',      -- gratuito | profissional | empresarial
    status_plano text default 'ativo',       -- ativo | trial | expirado | cancelado
    inicio_trial timestamptz,
    fim_trial timestamptz,
    ativo boolean default true,
    criado_em timestamptz default now(),
    atualizado_em timestamptz default now()
);

-- Colunas usadas pelo endpoint PUT /api/usuarios (perfil)
alter table public.usuarios add column if not exists telefone text;
alter table public.usuarios add column if not exists cargo text;
alter table public.usuarios add column if not exists empresa text;
alter table public.usuarios add column if not exists avatar_url text;

-- Remetente próprio do usuário (Gmail + senha de app) para comunicados/orçamentos
alter table public.usuarios add column if not exists smtp_email text;
alter table public.usuarios add column if not exists smtp_senha text;

-- ------------------------------------------------------------
-- DOCUMENTOS (upload / envio para assinatura)
-- ------------------------------------------------------------
create table if not exists public.documentos (
    id uuid primary key default gen_random_uuid(),
    nome_arquivo text not null,
    email_usuario text not null,
    tamanho text,
    tipo text,
    categoria text default 'Geral',
    destinatarios text,                      -- JSON com lista de signatários
    assunto text,
    mensagem text,
    storage_path text,
    status text default 'pendente',          -- pendente | enviado | signed | recusado
    pasta_id uuid,
    criado_em timestamptz default now()
);
alter table public.documentos add column if not exists pasta_id uuid;
alter table public.documentos add column if not exists atualizado_em timestamptz default now();

create index if not exists idx_documentos_email on public.documentos (email_usuario);

-- ------------------------------------------------------------
-- CONTRATOS (contratos de adesão gerados no pagamento
--            e, futuramente, contratos criados no editor)
-- ------------------------------------------------------------
create table if not exists public.contratos (
    id uuid primary key default gen_random_uuid(),
    nome text,
    cpf text,
    email text,
    plano text,
    nome_arquivo text,
    storage_path text,
    criado_em timestamptz default now()
);
-- Campos para o futuro editor de contratos
alter table public.contratos add column if not exists titulo text;
alter table public.contratos add column if not exists conteudo text;          -- corpo do contrato (HTML/markdown)
alter table public.contratos add column if not exists modelo_id uuid;
alter table public.contratos add column if not exists status text default 'rascunho'; -- rascunho | enviado | assinado | cancelado
alter table public.contratos add column if not exists valor numeric(12,2);
alter table public.contratos add column if not exists atualizado_em timestamptz default now();

create index if not exists idx_contratos_email on public.contratos (email);

-- ------------------------------------------------------------
-- MODELOS (templates de contrato / orçamento / comunicado)
-- ------------------------------------------------------------
create table if not exists public.modelos (
    id uuid primary key default gen_random_uuid(),
    email_usuario text not null,
    titulo text not null,
    tipo text default 'contrato',            -- contrato | orcamento | comunicado
    conteudo text,                           -- corpo com variáveis {{nome}}, {{valor}}...
    variaveis jsonb default '[]'::jsonb,
    criado_em timestamptz default now(),
    atualizado_em timestamptz default now()
);
-- Garante as colunas caso a tabela já existisse com outra estrutura
alter table public.modelos add column if not exists email_usuario text;
alter table public.modelos add column if not exists titulo text;
alter table public.modelos add column if not exists tipo text default 'contrato';
alter table public.modelos add column if not exists conteudo text;
alter table public.modelos add column if not exists variaveis jsonb default '[]'::jsonb;
alter table public.modelos add column if not exists criado_em timestamptz default now();
alter table public.modelos add column if not exists atualizado_em timestamptz default now();
create index if not exists idx_modelos_email on public.modelos (email_usuario);

-- ------------------------------------------------------------
-- ENVELOPES (fluxo de assinatura com múltiplos signatários)
-- ------------------------------------------------------------
create table if not exists public.envelopes (
    id uuid primary key default gen_random_uuid(),
    documento_id uuid references public.documentos (id) on delete cascade,
    email_usuario text not null,
    titulo text,
    status text default 'aguardando',        -- aguardando | parcial | concluido | cancelado
    prazo timestamptz,
    criado_em timestamptz default now()
);
alter table public.envelopes add column if not exists documento_id uuid;
alter table public.envelopes add column if not exists email_usuario text;
alter table public.envelopes add column if not exists titulo text;
alter table public.envelopes add column if not exists status text default 'aguardando';
alter table public.envelopes add column if not exists prazo timestamptz;
alter table public.envelopes add column if not exists criado_em timestamptz default now();

-- ------------------------------------------------------------
-- ASSINATURAS (cada assinatura individual de um envelope)
-- ------------------------------------------------------------
create table if not exists public.assinaturas (
    id uuid primary key default gen_random_uuid(),
    envelope_id uuid references public.envelopes (id) on delete cascade,
    documento_id uuid,
    nome_signatario text,
    email_signatario text,
    tipo text,                               -- contratante | contratada | testemunha
    token text unique,                       -- link único de assinatura
    status text default 'pendente',          -- pendente | assinado | recusado
    assinado_em timestamptz,
    ip_assinatura text,
    criado_em timestamptz default now()
);
alter table public.assinaturas add column if not exists envelope_id uuid;
alter table public.assinaturas add column if not exists documento_id uuid;
alter table public.assinaturas add column if not exists nome_signatario text;
alter table public.assinaturas add column if not exists email_signatario text;
alter table public.assinaturas add column if not exists tipo text;
alter table public.assinaturas add column if not exists token text;
alter table public.assinaturas add column if not exists status text default 'pendente';
alter table public.assinaturas add column if not exists assinado_em timestamptz;
alter table public.assinaturas add column if not exists ip_assinatura text;
alter table public.assinaturas add column if not exists criado_em timestamptz default now();
create index if not exists idx_assinaturas_token on public.assinaturas (token);

-- ------------------------------------------------------------
-- COMUNICACOES (comunicados enviados por e-mail)
-- ------------------------------------------------------------
create table if not exists public.comunicacoes (
    id uuid primary key default gen_random_uuid(),
    email_usuario text not null,
    assunto text not null,
    mensagem text,
    destinatarios jsonb default '[]'::jsonb, -- lista de e-mails
    anexos jsonb default '[]'::jsonb,        -- paths no storage
    status text default 'rascunho',          -- rascunho | enviado | erro
    enviado_em timestamptz,
    criado_em timestamptz default now()
);
-- Garante as colunas caso a tabela já existisse com outra estrutura
alter table public.comunicacoes add column if not exists email_usuario text;
alter table public.comunicacoes add column if not exists assunto text;
alter table public.comunicacoes add column if not exists mensagem text;
alter table public.comunicacoes add column if not exists destinatarios jsonb default '[]'::jsonb;
alter table public.comunicacoes add column if not exists anexos jsonb default '[]'::jsonb;
alter table public.comunicacoes add column if not exists status text default 'rascunho';
alter table public.comunicacoes add column if not exists enviado_em timestamptz;
alter table public.comunicacoes add column if not exists criado_em timestamptz default now();
create index if not exists idx_comunicacoes_email on public.comunicacoes (email_usuario);

-- ------------------------------------------------------------
-- ORÇAMENTOS (nova funcionalidade)
-- ------------------------------------------------------------
create table if not exists public.orcamentos (
    id uuid primary key default gen_random_uuid(),
    email_usuario text not null,
    numero serial,                           -- número sequencial do orçamento
    cliente_nome text not null,
    cliente_email text,
    cliente_documento text,                  -- CPF/CNPJ
    titulo text,
    descricao text,
    itens jsonb default '[]'::jsonb,         -- [{descricao, qtd, valor_unitario}]
    subtotal numeric(12,2) default 0,
    desconto numeric(12,2) default 0,
    total numeric(12,2) default 0,
    validade date,
    status text default 'rascunho',          -- rascunho | enviado | aprovado | recusado | expirado
    storage_path text,                       -- PDF gerado
    enviado_em timestamptz,
    criado_em timestamptz default now(),
    atualizado_em timestamptz default now()
);
create index if not exists idx_orcamentos_email on public.orcamentos (email_usuario);

-- ------------------------------------------------------------
-- STORAGE: bucket de documentos (já existe: verysing-docs)
-- Cria apenas se não existir.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('verysing-docs', 'verysing-docs', false)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Gatilho para manter atualizado_em automático
-- ------------------------------------------------------------
create or replace function public.set_atualizado_em()
returns trigger language plpgsql as $$
begin
    new.atualizado_em = now();
    return new;
end $$;

do $$
declare t text;
begin
    foreach t in array array['usuarios','contratos','modelos','orcamentos','documentos']
    loop
        if not exists (
            select 1 from pg_trigger
            where tgname = 'trg_atualizado_em_' || t
        ) then
            execute format(
                'create trigger trg_atualizado_em_%I before update on public.%I
                 for each row execute function public.set_atualizado_em()', t, t);
        end if;
    end loop;
end $$;
