#!/bin/bash

# Buhapka Automated Backup Script
# Backs up PostgreSQL database and uploads volume with 6-month retention

set -e  # Exit on error

# Configuration
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS=180  # 6 months
LOG_FILE="${BACKUP_DIR}/backup.log"

# Database configuration
DB_CONTAINER="${DB_CONTAINER:-postgres}"
DB_USER="${DB_USER:-buhapka}"
DB_NAME="${DB_NAME:-buhapka}"

# Docker volume name
UPLOADS_VOLUME="${UPLOADS_VOLUME:-buhapka_uploads}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

log "Starting backup process..."

# Backup PostgreSQL database
log "Backing up PostgreSQL database..."
DB_BACKUP_FILE="$BACKUP_DIR/db_$DATE.sql.gz"

if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$DB_BACKUP_FILE"; then
    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    log_success "Database backup completed: $DB_BACKUP_FILE ($DB_SIZE)"
else
    log_error "Database backup failed!"
    exit 1
fi

# Backup uploads volume
log "Backing up uploads volume..."
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads_$DATE.tar.gz"

if docker run --rm -v "$UPLOADS_VOLUME:/data" -v "$BACKUP_DIR:/backup" alpine tar czf "/backup/uploads_$DATE.tar.gz" -C /data .; then
    UPLOADS_SIZE=$(du -h "$UPLOADS_BACKUP_FILE" | cut -f1)
    log_success "Uploads backup completed: $UPLOADS_BACKUP_FILE ($UPLOADS_SIZE)"
else
    log_error "Uploads backup failed!"
    exit 1
fi

# Delete old backups (retention policy)
log "Applying retention policy (${RETENTION_DAYS} days)..."

# Count and delete old database backups
OLD_DB_COUNT=$(find "$BACKUP_DIR" -name "db_*.sql.gz" -type f -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
if [ "$OLD_DB_COUNT" -gt 0 ]; then
    find "$BACKUP_DIR" -name "db_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    log_warning "Deleted $OLD_DB_COUNT old database backup(s)"
else
    log "No old database backups to delete"
fi

# Count and delete old uploads backups
OLD_UPLOADS_COUNT=$(find "$BACKUP_DIR" -name "uploads_*.tar.gz" -type f -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
if [ "$OLD_UPLOADS_COUNT" -gt 0 ]; then
    find "$BACKUP_DIR" -name "uploads_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    log_warning "Deleted $OLD_UPLOADS_COUNT old uploads backup(s)"
else
    log "No old uploads backups to delete"
fi

# Summary
log "========================================="
log_success "Backup completed successfully!"
log "Database backup: $DB_BACKUP_FILE ($DB_SIZE)"
log "Uploads backup: $UPLOADS_BACKUP_FILE ($UPLOADS_SIZE)"
log "Retention period: $RETENTION_DAYS days"

# List current backups
TOTAL_DB_BACKUPS=$(find "$BACKUP_DIR" -name "db_*.sql.gz" -type f 2>/dev/null | wc -l)
TOTAL_UPLOADS_BACKUPS=$(find "$BACKUP_DIR" -name "uploads_*.tar.gz" -type f 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)

log "Current backups: $TOTAL_DB_BACKUPS database, $TOTAL_UPLOADS_BACKUPS uploads"
log "Total backup size: $TOTAL_SIZE"
log "========================================="

# Optional: Send email notification (requires mailx or sendmail)
# if command -v mail > /dev/null 2>&1; then
#     echo "Backup completed: $DATE" | mail -s "Buhapka Backup Success" admin@example.com
# fi

exit 0
