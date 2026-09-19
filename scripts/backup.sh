#!/bin/bash
set -e

# Load environment variables
source .env

BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="db_backup_${DATE}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${FILENAME}"

mkdir -p $BACKUP_DIR

echo "Starting database backup..."

# Execute pg_dump inside the postgres container
docker exec service-postgres pg_dump -U ${POSTGRES_USER:-postgres} ${POSTGRES_DB:-service_platform} | gzip > $BACKUP_PATH

echo "Backup created at ${BACKUP_PATH}"

# If MINIO is configured, upload the backup
if [ -n "$MINIO_ROOT_USER" ] && [ -n "$MINIO_ROOT_PASSWORD" ]; then
  echo "Uploading backup to MinIO/S3..."
  # Assume mc (MinIO Client) is installed, or use a temporary container
  docker run --rm -v $(pwd)/$BACKUP_DIR:/backups --network host \
    minio/mc sh -c "\
    mc alias set myminio http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} && \
    mc mb myminio/backups --ignore-existing && \
    mc cp /backups/${FILENAME} myminio/backups/"
  
  echo "Backup successfully uploaded to object storage."
fi

# Optional: Clean up old local backups (keep last 7 days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
echo "Cleaned up old local backups."
