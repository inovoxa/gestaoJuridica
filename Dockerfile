# LegalTech BR — imagem única de produção (web + worker).
# Build: docker build -t SEU_REGISTRY/legaltech-app:latest .
# Push:  docker push SEU_REGISTRY/legaltech-app:latest
# O mesmo image roda como "web" ou "worker" conforme o comando (ver entrypoint).

FROM node:20-alpine AS build
# pnpm via npm (evita o bug de assinatura do corepack no node:20-alpine).
RUN npm install -g pnpm@9.12.0 && apk add --no-cache openssl libc6-compat
WORKDIR /app

# Instala dependências (inclui devDeps: Next, Prisma CLI, tsx do worker).
COPY . .
RUN pnpm install --no-frozen-lockfile \
 && pnpm --filter @legaltech/db generate \
 && pnpm --filter @legaltech/web build

# ----- imagem final -----
FROM node:20-alpine AS runtime
RUN npm install -g pnpm@9.12.0 && apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copia o monorepo já instalado e construído.
COPY --from=build /app /app

RUN chmod +x /app/docker/entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["web"]
