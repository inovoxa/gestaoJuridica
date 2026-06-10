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

## Deploy em produção

Imagem única (`Dockerfile`) que roda como **web** ou **worker**; stack para **Docker Swarm + Portainer + Traefik** em `docker-stack.yml`. Passo a passo completo em **[DEPLOY.md](DEPLOY.md)** (build/push da imagem, rede overlay do Traefik, variáveis, primeira subida com seed).

## Roadmap (fases)

- **Fase 0 — Fundação** ✅: monorepo, schema single-tenant, auth/RBAC, util BR, worker, tema dark, website público.
- **Fase 1 — MVP núcleo** ✅: CRUD clientes, processos (lista/criar/detalhe + stage), prazos (dias úteis CPC), audiências, agenda, **Google Calendar bidirecional (OAuth2)**, **upload de documentos** (storage local/S3 + ciclo de vida) e **integração Chatwoot** (lead do site, card de processo no funil, página de configuração).
- **Fase 2 — DataJud + automação de prazos** ✅: integração com a API pública DataJud (CNJ) — sync de capa + movimentações por número CNJ; **extração automática de prazos** das movimentações (palavras-chave + dias úteis CPC); sync diário no worker; **alertas de prazo via Chatwoot** (5d/3d/1d/vencimento). Config em /config.
- **Fase 3 — IA** ✅: adapter multi-provedor (OpenAI/Anthropic/Gemini/Grok); **geração de petições** com contexto do processo; **explicação de movimentações** em linguagem simples; **consentimento LGPD/OAB** (Recomendação 001/2024) bloqueando IA sem autorização do cliente; uso auditado (AuditLog). Config em /config.
- **Automação de audiências** ✅: audiências detectadas automaticamente nas movimentações do DataJud (designação com data/hora) → criam `Hearing` + evento na agenda; lembretes 3d/1d via Chatwoot.
- **Fase 4 — Portal do cliente, Google Drive, financeiro/relatórios** ✅: **portal do cliente** (`/portal`) com login próprio, processos, prazos, audiências e **upload de provas**; **storage Google Drive** (driver `gdrive`, escopo `drive.file` na conexão Google); **financeiro** (faturas/honorários por processo); **relatório do processo** em página imprimível (PDF). IA agora também via **OpenRouter**.

## Storage de documentos (plugável)

`STORAGE_DRIVER` define onde os arquivos ficam:
- `local` — filesystem (`STORAGE_LOCAL_PATH`).
- `s3` — S3/MinIO (recomendado p/ LGPD; credenciais `S3_*`).
- `gdrive` — Google Drive (reutiliza a conexão Google de OAuth; escopo `drive.file`). A "chave" do documento passa a ser o id do arquivo no Drive.

## Automação de audiências — integração via DataJud

A **API Pública do DataJud (CNJ)** não possui um endpoint dedicado de audiências: as designações chegam dentro das **movimentações** (`movimentos[]`). O sistema lê cada movimentação no sync, detecta termos de audiência + data/hora (`packages/core/br/extracao-audiencia.ts`) e cria a audiência + evento automaticamente.

**APIs nativas dos tribunais (futuro, opcional):** PJe, e-SAJ, Projudi e Eproc expõem agendas estruturadas (audiências futuras/realizadas, links de videoconferência), porém exigem **autenticação/convênio institucional** por tribunal. A arquitetura de adapters (`packages/core/adapters`) permite plugar esses provedores quando houver credencial — sem alterar o restante do fluxo.

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
