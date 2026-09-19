# Production Deployment Architecture & Operations

This document details the production deployment architecture, infrastructure components, and standard operational procedures for the Service Platform.

## Architecture Overview

The system is deployed using **Docker Compose** as a containerized stack.

- **Web (Next.js)**: Server-Side Rendered React frontend.
- **API (NestJS)**: Stateless REST API, scaled via Docker replicas.
- **Worker (NestJS/BullMQ)**: Background job processing, independently scalable.
- **PostgreSQL**: Primary relational database.
- **Redis**: In-memory cache and message broker for BullMQ.
- **MinIO**: S3-compatible object storage for file uploads/backups.
- **Caddy**: Reverse proxy that handles SSL/TLS termination and routes traffic to the Web and API instances.
- **Prometheus & Grafana**: Time-series monitoring and dashboards.

### Scaling Strategy
- **API Instances**: Replicated dynamically via `API_REPLICAS` environment variable. Caddy automatically load balances incoming requests round-robin across all healthy API containers.
- **Worker Instances**: Replicated via `WORKER_REPLICAS`. Workers pull from the Redis queue independently, providing horizontal scaling for heavy background processing.

## Operational Procedures

### 1. Initial Setup and Configuration
Before starting the stack, ensure your `.env` file is populated with production secrets:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `JWT_SECRET`
- `DOMAIN` (for Caddy SSL generation)
- `TLS_EMAIL` (for Let's Encrypt certificate notices)

### 2. Deployment
Deployment is fully automated via **GitHub Actions** (`.github/workflows/deploy.yml`).
1. Code pushed to `main` is tested.
2. Docker images are built and pushed to GitHub Container Registry (GHCR).
3. The server is triggered via SSH to pull the latest changes and run `scripts/deploy.sh`.

#### Manual Deployment / Rollback
To manually deploy or rollback:
```bash
git checkout <commit-hash>
./scripts/deploy.sh
```

### 3. Database Migrations
Migrations run automatically during deployment via `scripts/deploy.sh`.
It spins up a temporary API container connected to the database network and executes:
```bash
pnpm --filter @service/api db:migrate:prod
```
*Migration Safety*: Prisma Migrate generates SQL scripts that are applied transactionally. If a migration fails, the database rolls back the transaction.

### 4. Backups and Recovery
Database backups are fully automated via `scripts/backup.sh`.
- Dumps the PostgreSQL database into a compressed `.sql.gz` file.
- Uploads the backup to **MinIO** (or AWS S3 if configured).
- Cleans up local backups older than 7 days.

**Cron Setup Recommendation:**
Add this to your server's crontab (`crontab -e`) to run daily at 2 AM:
```cron
0 2 * * * /opt/service-platform/scripts/backup.sh >> /var/log/db_backup.log 2>&1
```

**Restoring from Backup:**
1. Extract the backup file: `gunzip db_backup_XXX.sql.gz`
2. Restore to PostgreSQL:
```bash
cat db_backup_XXX.sql | docker exec -i service-postgres psql -U postgres -d service_platform
```

### 5. Health Checks and Graceful Shutdown
- **Health Checks**: Docker health checks are configured for `postgres`, `redis`, and `minio`. Web and API rely on Docker `depends_on: condition: service_healthy` to ensure they do not start until dependencies are ready.
- **Graceful Shutdown**: Handled automatically by NestJS and Docker. When `docker-compose down` or `restart` is called, a SIGTERM is sent, and NestJS completes running requests and BullMQ jobs before terminating.

### 6. Monitoring
- **Prometheus** scrapes the API `/metrics` endpoints every 15 seconds.
- **Grafana** is accessible at `grafana.<YOUR_DOMAIN>` for visualizing health, latency, queue depth, and memory usage.
