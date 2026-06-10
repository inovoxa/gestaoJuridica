#!/bin/sh
set -e

# Aplica o schema no banco (idempotente) quando solicitado — normalmente no serviço web.
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "==> Aplicando schema (prisma db push)..."
  pnpm --filter @legaltech/db push
  if [ "$RUN_SEED" = "true" ]; then
    echo "==> Semeando dados de demonstração..."
    pnpm --filter @legaltech/db seed || echo "(seed ignorado — provavelmente já existe)"
  fi
fi

case "$1" in
  web)
    echo "==> Iniciando aplicação web (Next.js)"
    exec pnpm --filter @legaltech/web start
    ;;
  worker)
    echo "==> Iniciando worker (BullMQ)"
    exec pnpm --filter @legaltech/worker start
    ;;
  *)
    exec "$@"
    ;;
esac
