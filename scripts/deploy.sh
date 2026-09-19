#!/bin/bash
set -e

echo "Starting Deployment..."

# 1. Pull latest images
docker-compose -f docker/docker-compose.prod.yml pull

# 2. Run Database Migrations (using a temporary container connected to the db network)
# We can use the api image to run migrations since it contains Prisma
echo "Running Database Migrations..."
docker-compose -f docker/docker-compose.prod.yml run --rm \
  -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public" \
  api pnpm --filter @service/api db:migrate:prod

# 3. Bring up new containers / Restart updated containers
echo "Starting updated services..."
docker-compose -f docker/docker-compose.prod.yml up -d --remove-orphans

# 4. Reload Caddy configuration if it changed (Zero Downtime)
echo "Reloading Reverse Proxy..."
docker exec service-caddy caddy reload --config /etc/caddy/Caddyfile || true

# 5. Clean up unused images and volumes
docker image prune -f

echo "Deployment Successful!"
