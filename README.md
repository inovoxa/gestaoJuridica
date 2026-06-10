# LegalTech BR — Sistema de Gestão Jurídica

Sistema SaaS **independente** (não-Odoo) para escritórios de advocacia brasileiros, aderente à **LGPD** e ao **sigilo profissional (OAB)**, integrado ao CRM **Chatwoot** (Kanban/Funis/Atendimentos).

Reconstrução, como aplicação web própria, do domínio do módulo Odoo `eb_law_management` (usado apenas como especificação funcional de referência).

## Stack

- **Next.js 15** (App Router, TypeScript) — UI + API própria (`/api/v1`)
- **PostgreSQL + Prisma** — multi-tenant por `accountId` (escritório)
- **Worker Node + BullMQ + Redis** — crons e tarefas pesadas (sync DataJud, alertas de prazo, IA)
- **Tailwind + shadcn/ui** — interface
- **Auth.js** — autenticação, RBAC, multi-tenant
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

- **Fase 0 — Fundação** *(em andamento)*: monorepo, schema, auth/RBAC multi-tenant, util BR, worker base.
- **Fase 1 — MVP núcleo**: clientes, processos, audiências, agenda, prazos manuais, documentos (storage), dashboard, sync Chatwoot.
- **Fase 2 — DataJud + automação de prazos**: sync CNJ, extração automática de prazos, alertas multi-canal.
- **Fase 3 — IA**: petições, jurisprudência, validação de documentos (+ consentimento LGPD/OAB).
- **Fase 4 — Portal do cliente, Google Drive, financeiro/relatórios**.

## Conformidade legal

- Isolamento estrito multi-tenant por `accountId` (sigilo entre escritórios).
- Credenciais criptografadas em repouso; storage S3 com criptografia.
- `AuditLog` de acesso a dados sensíveis; `ConsentRecord` antes de qualquer IA sobre dados do cliente (Recomendação OAB 001/2024).
- Flag de processo sigiloso restringindo visibilidade interna.
