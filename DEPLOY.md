# Deploy em produção — Docker Swarm + Portainer + Traefik

O sistema roda como **uma imagem única** (`Dockerfile`) que serve tanto a aplicação **web** quanto o **worker** (o comando define o papel). O stack (`docker-stack.yml`) sobe web, worker, PostgreSQL e Redis.

## 1. Pré-requisitos no swarm

- Traefik já rodando no swarm, com:
  - provider do Swarm habilitado,
  - um entrypoint `websecure` (443) e um **certresolver** (ex.: `letsencrypt`).
- Rede overlay externa do Traefik (ajuste o nome se o seu for diferente de `traefik-public`):

```bash
docker network create --driver overlay --attachable traefik-public
```

## 2. Imagem da aplicação

### Opção A — CI automática (recomendada)
O workflow `.github/workflows/docker-publish.yml` builda e publica no **GHCR** a cada push na `main`:
- Imagem: `ghcr.io/inovoxa/gestaojuridica:latest`
- Roda os testes do core (CNJ/prazos) antes de publicar.

**Tornar a imagem acessível ao swarm:**
- **Pacote público:** em GitHub → *Packages* → `gestaojuridica` → *Package settings* → *Change visibility → Public*. Aí o swarm baixa sem login.
- **Pacote privado:** autentique os nós (ou cadastre o registry no Portainer):
  ```bash
  echo "$GHCR_PAT" | docker login ghcr.io -u SEU_USUARIO --password-stdin
  ```
  (PAT com escopo `read:packages`)

### Opção B — build manual
O Swarm **não constrói** imagem a partir do stack — publique num registry acessível pelos nós:
```bash
docker build -t SEU_REGISTRY/legaltech-app:latest .
docker push SEU_REGISTRY/legaltech-app:latest
```
> Swarm de **um nó só**: pode usar a imagem local (`docker build -t legaltech-app:latest .` e `IMAGE=legaltech-app:latest`).

## 3. Subir o stack

**Via CLI:**
```bash
# exporte as variáveis (ver .env.production.example) e:
docker stack deploy -c docker-stack.yml legaltech
```

**Via Portainer:** *Stacks → Add stack → Web editor*, cole o conteúdo de `docker-stack.yml` e preencha as **Environment variables** (use o `.env.production.example` como referência).

### Variáveis essenciais
| Variável | Descrição |
|---|---|
| `IMAGE` | imagem publicada (ex.: `registry/legaltech-app:latest`) |
| `APP_DOMAIN` | domínio público (ex.: `juridico.seudominio.com.br`) |
| `TRAEFIK_CERTRESOLVER` | nome do certresolver do seu Traefik |
| `POSTGRES_PASSWORD` | senha do banco |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `CREDENTIALS_ENCRYPTION_KEY` | `openssl rand -base64 32` (cripto dos tokens) |
| `RUN_SEED` | `true` **somente na 1ª subida** (cria escritório/usuários demo), depois `false` |
| `STORAGE_DRIVER` | `local`, `s3` ou `gdrive` |

## 4. Primeira subida

1. Defina `RUN_SEED=true` e faça o deploy. O serviço **web** aplica o schema (`prisma db push`) e semeia os dados.
2. Acesse `https://APP_DOMAIN` → login `admin@silva.adv.br` / `admin123`.
3. **Troque as senhas** e, em **Configurações**, atualize os dados do escritório.
4. Volte `RUN_SEED=false` e atualize o stack (evita recriar dados demo).

## 5. Detalhes de operação

- **Migrações:** o `web` roda `prisma db push` a cada start (idempotente). Mantenha **1 réplica** de web.
- **Worker:** processa prazos, audiências, DataJud e Google Calendar. Mantenha **1 réplica**.
- **Storage:** com `local`, os arquivos ficam no volume `storage`. ⚠️ Em swarm **multi-nó**, volumes `local` não são compartilhados entre nós — use `s3`/MinIO ou `gdrive` (recomendado), ou fixe web+worker no mesmo nó (`deploy.placement.constraints`). Em **nó único**, o volume local funciona normalmente.
- **Backups:** faça backup do volume `pgdata` (banco) e do storage de documentos.
- **HTTPS/LGPD:** o Traefik termina o TLS; `AUTH_URL`/`APP_URL` usam `https://APP_DOMAIN`. Mantenha os segredos fora do Git.

## 6. Atualizações

Com a CI ativa, cada push na `main` republica `ghcr.io/inovoxa/gestaojuridica:latest`. Para aplicar no swarm:

```bash
docker service update --image ghcr.io/inovoxa/gestaojuridica:latest legaltech_web
docker service update --image ghcr.io/inovoxa/gestaojuridica:latest legaltech_worker
```
(ou no Portainer: *Stacks → legaltech → Update / Pull and redeploy*)

> Dica: para releases versionadas, crie uma tag `vX.Y.Z` — a CI publica a imagem com a mesma tag.
