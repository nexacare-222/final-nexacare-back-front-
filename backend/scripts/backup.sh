#!/usr/bin/env bash
# =============================================================================
# NexaCare Automated PostgreSQL Backup Script
# =============================================================================
# Hardened backup script utilizing pg_dump and compressing the output.
# Configured for standard cron usage.
#
# IMPORTANT: Ensure the running user has execution rights: `chmod +x backup.sh`
# =============================================================================

set -e          # Exit immediately if a command exits with a non-zero status
set -o pipefail # Return the exit status of the last command in the pipe that failed
set -u          # Treat unset variables as an error

# Load environment variables (ensure DATABASE_URL is available)
if [ -f "../.env" ]; then
  source ../.env
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[Error] DATABASE_URL is not set. Aborting backup."
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/tmp/nexacare_backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/nexacare_db_${TIMESTAMP}.sql.gz"

echo "[Info] Starting backup process at $(date)"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# Perform pg_dump and compress on the fly
# Using standard connection string format provided by Prisma/Supabase
echo "[Info] Dumping database to $BACKUP_FILE..."
pg_dump "$DATABASE_URL" --no-owner --clean --if-exists | gzip > "$BACKUP_FILE"

# Secure the backup file
chmod 600 "$BACKUP_FILE"

echo "[Success] Database backup completed: $BACKUP_FILE"
echo "[Info] File size: $(du -sh "$BACKUP_FILE" | cut -f1)"

# =============================================================================
# Cloud Upload Integration Placeholder
# =============================================================================
# Uncomment and configure the desired cloud provider below.

# AWS S3:
# S3_BUCKET="s3://your-nexacare-backups-bucket"
# echo "[Info] Uploading to AWS S3..."
# aws s3 cp "$BACKUP_FILE" "$S3_BUCKET/" --no-progress
# if [ $? -eq 0 ]; then
#   echo "[Success] Uploaded to S3."
# else
#   echo "[Error] S3 upload failed."
# fi

# Google Cloud Storage (GCS):
# GCS_BUCKET="gs://your-nexacare-backups-bucket"
# echo "[Info] Uploading to Google Cloud Storage..."
# gsutil cp "$BACKUP_FILE" "$GCS_BUCKET/"

# Azure Blob Storage:
# AZURE_CONTAINER="your-nexacare-container"
# echo "[Info] Uploading to Azure Blob Storage..."
# az storage blob upload --file "$BACKUP_FILE" --container-name "$AZURE_CONTAINER" --name "nexacare_db_${TIMESTAMP}.sql.gz"

# =============================================================================
# Retention Policy (Local Cleanup)
# =============================================================================
# Keep only the last 7 days of local backups to save disk space
echo "[Info] Cleaning up local backups older than 7 days..."
find "$BACKUP_DIR" -name "nexacare_db_*.sql.gz" -type f -mtime +7 -delete

echo "[Success] Backup job finished successfully at $(date)."
exit 0
