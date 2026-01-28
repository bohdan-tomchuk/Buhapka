#!/bin/bash

# Buhapka Restore Script
# Restores PostgreSQL database and uploads volume from backup

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_CONTAINER="${DB_CONTAINER:-postgres}"
DB_USER="${DB_USER:-buhapka}"
DB_NAME="${DB_NAME:-buhapka}"
UPLOADS_VOLUME="${UPLOADS_VOLUME:-buhapka_uploads}"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -d, --database FILE    Database backup file to restore"
    echo "  -u, --uploads FILE     Uploads backup file to restore"
    echo "  -a, --all PREFIX       Restore both database and uploads with matching prefix"
    echo "  -l, --list             List available backups"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list"
    echo "  $0 --database /backups/db_20260126_030000.sql.gz"
    echo "  $0 --uploads /backups/uploads_20260126_030000.tar.gz"
    echo "  $0 --all 20260126_030000"
    exit 1
}

# List available backups
list_backups() {
    print_header "Available Backups"

    echo ""
    echo "Database Backups:"
    if ls "$BACKUP_DIR"/db_*.sql.gz 1> /dev/null 2>&1; then
        for file in "$BACKUP_DIR"/db_*.sql.gz; do
            SIZE=$(du -h "$file" | cut -f1)
            DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d'.' -f1)
            echo "  • $(basename "$file") - $SIZE - $DATE"
        done
    else
        echo "  No database backups found"
    fi

    echo ""
    echo "Uploads Backups:"
    if ls "$BACKUP_DIR"/uploads_*.tar.gz 1> /dev/null 2>&1; then
        for file in "$BACKUP_DIR"/uploads_*.tar.gz; do
            SIZE=$(du -h "$file" | cut -f1)
            DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d'.' -f1)
            echo "  • $(basename "$file") - $SIZE - $DATE"
        done
    else
        echo "  No uploads backups found"
    fi

    echo ""
    exit 0
}

# Restore database
restore_database() {
    local DB_FILE=$1

    if [ ! -f "$DB_FILE" ]; then
        print_error "Database backup file not found: $DB_FILE"
        exit 1
    fi

    print_header "Restoring Database"

    # Verify file integrity
    print_info "Verifying backup file integrity..."
    if gunzip -t "$DB_FILE" 2>/dev/null; then
        print_success "Backup file is valid"
    else
        print_error "Backup file is corrupted"
        exit 1
    fi

    # Stop backend
    print_info "Stopping backend service..."
    docker-compose stop backend 2>/dev/null || true

    # Check if database container is running
    if ! docker ps | grep -q "$DB_CONTAINER"; then
        print_warning "Database container is not running. Starting it..."
        docker-compose up -d postgres
        sleep 5
    fi

    # Restore database
    print_info "Restoring database from: $(basename "$DB_FILE")"
    if gunzip -c "$DB_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        print_success "Database restored successfully"
    else
        print_error "Database restore failed"
        exit 1
    fi

    # Verify restore
    print_info "Verifying database..."
    EXPENSE_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM expense;" 2>/dev/null | xargs)
    print_success "Database contains $EXPENSE_COUNT expenses"

    # Restart backend
    print_info "Restarting backend service..."
    docker-compose start backend

    print_success "Database restore completed!"
}

# Restore uploads
restore_uploads() {
    local UPLOADS_FILE=$1

    if [ ! -f "$UPLOADS_FILE" ]; then
        print_error "Uploads backup file not found: $UPLOADS_FILE"
        exit 1
    fi

    print_header "Restoring Uploads"

    # Verify file integrity
    print_info "Verifying backup file integrity..."
    if tar tzf "$UPLOADS_FILE" > /dev/null 2>&1; then
        print_success "Backup file is valid"
    else
        print_error "Backup file is corrupted"
        exit 1
    fi

    # Stop backend
    print_info "Stopping backend service..."
    docker-compose stop backend 2>/dev/null || true

    # Restore uploads
    print_info "Restoring uploads from: $(basename "$UPLOADS_FILE")"
    if docker run --rm -v "$UPLOADS_VOLUME:/data" -v "$(dirname "$UPLOADS_FILE"):/backup" alpine sh -c "cd /data && tar xzf /backup/$(basename "$UPLOADS_FILE")" > /dev/null 2>&1; then
        print_success "Uploads restored successfully"
    else
        print_error "Uploads restore failed"
        exit 1
    fi

    # Verify restore
    print_info "Verifying uploads..."
    FILE_COUNT=$(docker run --rm -v "$UPLOADS_VOLUME:/data" alpine find /data -type f | wc -l | xargs)
    print_success "Uploads volume contains $FILE_COUNT files"

    # Restart backend
    print_info "Restarting backend service..."
    docker-compose start backend

    print_success "Uploads restore completed!"
}

# Main script
DB_FILE=""
UPLOADS_FILE=""
RESTORE_ALL=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--database)
            DB_FILE="$2"
            shift 2
            ;;
        -u|--uploads)
            UPLOADS_FILE="$2"
            shift 2
            ;;
        -a|--all)
            RESTORE_ALL="$2"
            shift 2
            ;;
        -l|--list)
            list_backups
            ;;
        -h|--help)
            usage
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Check if any restore option is provided
if [ -z "$DB_FILE" ] && [ -z "$UPLOADS_FILE" ] && [ -z "$RESTORE_ALL" ]; then
    print_error "No restore option specified"
    echo ""
    usage
fi

# Restore all with matching prefix
if [ -n "$RESTORE_ALL" ]; then
    DB_FILE="$BACKUP_DIR/db_${RESTORE_ALL}.sql.gz"
    UPLOADS_FILE="$BACKUP_DIR/uploads_${RESTORE_ALL}.tar.gz"

    print_header "Restoring Complete Backup: $RESTORE_ALL"
    echo ""
fi

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Confirm restore
echo ""
print_warning "This will restore data and may overwrite existing data!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    print_info "Restore cancelled"
    exit 0
fi
echo ""

# Perform restores
if [ -n "$DB_FILE" ]; then
    restore_database "$DB_FILE"
    echo ""
fi

if [ -n "$UPLOADS_FILE" ]; then
    restore_uploads "$UPLOADS_FILE"
    echo ""
fi

print_header "Restore Complete"
print_success "All restore operations completed successfully!"

exit 0
