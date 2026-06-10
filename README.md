# LegalTech BR — Sistema de Gestão Jurídica + Website

Sistema **independente** (não-Odoo) para escritório de advocacia brasileiro, aderente à **LGPD** e ao **sigilo profissional (OAB)**, integrado ao CRM **Chatwoot** (Kanban/Funis/Atendimentos).

**Arquitetura single-tenant:** uma instância por escritório. Cada deploy serve **um** escritório e inclui:
1. **Painel de gestão** (privado) — processos, clientes, audiências, prazos, documentos, agenda, dashboard.
2. **Website institucional** (público) — home com endereço/contato, áreas de atuação, sobre, equipe e formulário de contato (vira lead no Chatwoot).

UI **dark** sofisticada (estilo "Trust & Authority": navy + dourado, fontes EB Garamond/Lato).

Reconstrução, como aplicação web própria, do domínio do módulo Odoo `eb_law_management` (usado apenas como especificação funcional de referência).

## Stack

- **Next.js 15** (App Router, React 19, TypeScript) — painel + website + API própria
- **PostgreSQL + Prisma** — single-tenant (escritório = `Firm` singleton)
- **Worker Node + BullMQ + Redis** — crons e tarefas pesadas (sync DataJud, alertas de prazo, IA)
- **Tailwind** (tema dark navy+dourado) + **lucide-react** (ícones)
- **Auth.js** — autenticação + RBAC (admin, advogado, secretaria, cliente)
- **Storage plugável** — local / S3 (MinIO) / Google Drive

## Estrutura (monorepo pnpm + Turborepo)

```
apps/
  web/        → Next.js (UI + API)
  worker/     → BullMQ workers + schedulers
packages/
  db/         → Prisma schema, client, migrations, seed
  core/       → domínio: serviços, adapters (storage/ai/chatwoot/datajud), util BR (CNJ, prazos)
```

## Setup local

Pré-requisitos: **Node 20+**, **pnpm 9+**, **Docker** (Postgres + Redis + MinIO).

```bash
# 1. Dependências
pnpm install

# 2. Infra local (Postgres, Redis, MinIO)
docker compose up -d

# 3. Variáveis de ambiente
cp .env.example .env   # ajuste os segredos

# 4. Banco
pnpm db:migrate
pnpm db:seed

# 5. Subir app (web) e worker
pnpm dev        # Next.js em http://localhost:3000
pnpm worker     # worker de jobs/crons
```

## Roadmap (fases)

- **Fase 0 — Fundação** ✅: monorepo, schema single-tenant, auth/RBAC, util BR, worker, tema dark, website público.
- **Fase 1 — MVP núcleo** ✅: CRUD clientes, processos (lista/criar/detalhe + stage), prazos (dias úteis CPC), audiências, agenda, **Google Calendar bidirecional (OAuth2)**, **upload de documentos** (storage local/S3 + ciclo de vida) e **integração Chatwoot** (lead do site, card de processo no funil, página de configuração).
- **Fase 2 — DataJud + automação de prazos**: sync CNJ, extração automática de prazos, alertas multi-canal.
- **Fase 3 — IA**: petições, jurisprudência, validação de documentos (+ consentimento LGPD/OAB).
- **Fase 4 — Portal do cliente, Google Drive, financeiro/relatórios**.

## Google Calendar (sync bidirecional)

A agenda sincroniza com o Google Calendar via OAuth2:
- Conecte em **Agenda → Conectar** (`/api/google/oauth/start`); o callback guarda o refresh token criptografado (AES-256-GCM).
- **Saída:** ao criar/excluir audiências, o evento é espelhado no Google (`pushEventToGoogle`).
- **Entrada:** o worker faz *pull* incremental a cada 10 min (`google-pull`), trazendo eventos criados no Google.
- Requer `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (Calendar API habilitada) e redirect URI `{APP_URL}/api/google/callback`.

## Conformidade legal

- Isolamento estrito multi-tenant por `accountId` (sigilo entre escritórios).
- Credenciais criptografadas em repouso; storage S3 com criptografia.
- `AuditLog` de acesso a dados sensíveis; `ConsentRecord` antes de qualquer IA sobre dados do cliente (Recomendação OAB 001/2024).
- Flag de processo sigiloso restringindo visibilidade interna.
