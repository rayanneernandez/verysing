# Configuração Supabase + E-mail (VerySing)

O projeto usa Supabase (PostgreSQL + Storage) e Gmail SMTP para envio de e-mails.

## 1. Banco de dados (obrigatório)

Rode o arquivo **`supabase_schema.sql`** no painel do Supabase:

1. Acesse o projeto no [supabase.com](https://supabase.com)
2. Menu lateral → **SQL Editor** → **New query**
3. Cole todo o conteúdo de `supabase_schema.sql` e clique em **Run**

O script é **idempotente**: pode rodar quantas vezes quiser sem apagar dados.
Ele cria/completa as tabelas: `usuarios`, `documentos`, `contratos`, `modelos`,
`envelopes`, `assinaturas`, `comunicacoes`, `orcamentos` e o bucket `verysing-docs`.

## 2. E-mail (Gmail SMTP)

Para os comunicados e envio de orçamentos funcionarem:

1. Na conta Google que vai enviar os e-mails, ative a **verificação em 2 etapas**
2. Crie uma **senha de app**: https://myaccount.google.com/apppasswords
3. Preencha no `.env` (local) e nas **Environment Variables da Vercel**:
   - `GMAIL_USER` = seuemail@gmail.com
   - `GMAIL_APP_PASSWORD` = a senha de app gerada (16 letras)

## 3. Variáveis de ambiente na Vercel

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_KEY` | Chave anon do Supabase |
| `GMAIL_USER` | E-mail remetente |
| `GMAIL_APP_PASSWORD` | Senha de app do Gmail |
| `PRIVATE_KEY_PEM` | Chave privada de assinatura digital |

## 4. Usuários de teste (já criados no banco)

Senha de todos: `Verysing@2026` (troque depois no perfil!)

| E-mail | Plano |
|---|---|
| rayanne.ernandez@globaltera.com.br | empresarial |
| gratuito@verysing.com.br | gratuito |
| profissional@verysing.com.br | profissional |
| empresarial@verysing.com.br | empresarial |
| admin@verysing.com.br | admin (vê o painel de Administração) |

## 5. Limites por plano (aplicados no backend)

| Recurso | Gratuito | Profissional | Empresarial | Admin |
|---|---|---|---|---|
| Contratos/mês | 5 | 15 | Ilimitado | Ilimitado |
| Docs no drive | 10 | 30 | 200 | Ilimitado |
| Comunicados/mês | — | 10 | 50 | Ilimitado |
| E-mails/mês | — | 2.000 | 25.000 | Ilimitado |

## Como rodar localmente

```bash
pip install -r requirements.txt
start.bat            # backend em http://localhost:8000 (mesma API da Vercel)

cd web
npm install
npm run dev          # frontend em http://localhost:5173
```

No dev local, crie `web/.env` com `VITE_API_URL=http://localhost:8000` para o
frontend achar o backend.
