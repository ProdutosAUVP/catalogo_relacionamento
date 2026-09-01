#!/bin/sh
# Aplica as migrations pendentes antes de aceitar tráfego.
#
# `migrate deploy` só executa o que ainda não rodou e nunca gera migration
# nova, então é seguro em toda subida e em múltiplas réplicas.
set -e

echo "Aplicando migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Iniciando o servidor na porta ${PORT:-3000}..."
exec node server.js
