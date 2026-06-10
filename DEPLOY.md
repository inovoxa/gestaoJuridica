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

## 2. Build e push da imagem

O Swarm **não constrói** imagem a partir do stack — publique num registry acessível pelos nós:

```bash
docker build -t SEU_REGISTRY/legaltech-app:latest .
docker push SEU_REGISTRY/legaltech-app:latest
```

> Swarm de **um nó só**: pode pular o push e usar a imagem local (`docker build -t legaltech-app:latest .` e `IMAGE=legaltech-app:latest`).
>
> No **Portainer** também dá para construir: *Images → Build a new image* (a partir do repositório Git), depois faça o push para o registry.

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

```bash
docker build -t SEU_REGISTRY/legaltech-app:latest .
docker push SEU_REGISTRY/legaltech-app:latest
docker service update --image SEU_REGISTRY/legaltech-app:latest legaltech_web
docker service update --image SEU_REGISTRY/legaltech-app:latest legaltech_worker
```
(ou recarregue o stack no Portainer)
