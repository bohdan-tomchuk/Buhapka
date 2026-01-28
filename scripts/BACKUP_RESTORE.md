# Backup and Restore Instructions

This document provides comprehensive instructions for backing up and restoring the Buhapka application data.

## Automated Backup Setup

### Manual Backup Execution

Run the backup script manually:

```bash
./scripts/backup.sh
```

The script will create two backup files in `/backups` directory:
- `db_YYYYMMDD_HHMMSS.sql.gz` - PostgreSQL database dump
- `uploads_YYYYMMDD_HHMMSS.tar.gz` - Uploaded receipts and files

### Environment Variables

You can customize the backup behavior using environment variables:

```bash
# Custom backup directory
BACKUP_DIR=/path/to/backups ./scripts/backup.sh

# Custom database container name
DB_CONTAINER=my-postgres ./scripts/backup.sh

# Custom database credentials
DB_USER=myuser DB_NAME=mydb ./scripts/backup.sh

# Custom uploads volume name
UPLOADS_VOLUME=my-uploads ./scripts/backup.sh
```

### Automated Backup with Cron

Set up daily automated backups at 3 AM:

1. Open crontab editor:
   ```bash
   crontab -e
   ```

2. Add the following line:
   ```
   0 3 * * * /path/to/Buhapka/scripts/backup.sh >> /path/to/backups/cron.log 2>&1
   ```

3. For production servers, use absolute paths:
   ```
   0 3 * * * /opt/buhapka/scripts/backup.sh >> /opt/buhapka/backups/cron.log 2>&1
   ```

4. Verify cron job is scheduled:
   ```bash
   crontab -l
   ```

### Alternative Cron Schedules

```bash
# Every day at 2:30 AM
30 2 * * * /path/to/backup.sh

# Every 6 hours
0 */6 * * * /path/to/backup.sh

# Every Sunday at midnight
0 0 * * 0 /path/to/backup.sh

# Twice daily (6 AM and 6 PM)
0 6,18 * * * /path/to/backup.sh
```

## Restore Procedures

### Database Restore

1. **Stop the application** to prevent data conflicts:
   ```bash
   docker-compose stop backend
   ```

2. **Locate your backup file**:
   ```bash
   ls -lh /backups/db_*.sql.gz
   ```

3. **Restore the database** (replace with your backup filename):
   ```bash
   # Method 1: Direct restore
   gunzip -c /backups/db_20260126_030000.sql.gz | docker exec -i postgres psql -U buhapka -d buhapka

   # Method 2: Drop and recreate database (WARNING: deletes all data)
   docker exec -i postgres psql -U buhapka -d postgres -c "DROP DATABASE IF EXISTS buhapka;"
   docker exec -i postgres psql -U buhapka -d postgres -c "CREATE DATABASE buhapka;"
   gunzip -c /backups/db_20260126_030000.sql.gz | docker exec -i postgres psql -U buhapka -d buhapka
   ```

4. **Verify restore**:
   ```bash
   docker exec postgres psql -U buhapka -d buhapka -c "SELECT COUNT(*) FROM expense;"
   ```

5. **Restart the application**:
   ```bash
   docker-compose start backend
   ```

### Uploads Volume Restore

1. **Stop the backend** to prevent file access conflicts:
   ```bash
   docker-compose stop backend
   ```

2. **Remove existing uploads** (optional, if you want clean restore):
   ```bash
   docker volume rm buhapka_uploads
   docker volume create buhapka_uploads
   ```

3. **Restore uploads volume**:
   ```bash
   docker run --rm -v buhapka_uploads:/data -v /backups:/backup alpine sh -c "cd /data && tar xzf /backup/uploads_20260126_030000.tar.gz"
   ```

4. **Verify restore**:
   ```bash
   docker run --rm -v buhapka_uploads:/data alpine ls -lah /data
   ```

5. **Restart the backend**:
   ```bash
   docker-compose start backend
   ```

### Complete System Restore

To restore both database and uploads in one operation:

```bash
# Stop services
docker-compose down

# Restore database
docker-compose up -d postgres
sleep 10  # Wait for PostgreSQL to be ready
gunzip -c /backups/db_YYYYMMDD_HHMMSS.sql.gz | docker exec -i postgres psql -U buhapka -d buhapka

# Restore uploads
docker run --rm -v buhapka_uploads:/data -v /backups:/backup alpine sh -c "cd /data && tar xzf /backup/uploads_YYYYMMDD_HHMMSS.tar.gz"

# Start all services
docker-compose up -d
```

## Disaster Recovery

### Off-site Backup

For production environments, copy backups to remote storage:

```bash
# Using rsync to remote server
rsync -avz /backups/ user@backup-server:/remote/backups/

# Using AWS S3
aws s3 sync /backups/ s3://my-backup-bucket/buhapka/

# Using rclone (supports multiple cloud providers)
rclone sync /backups/ remote:buhapka-backups/
```

### Backup Verification

Regularly verify backups are valid:

```bash
# Test database backup integrity
gunzip -t /backups/db_20260126_030000.sql.gz

# Test uploads archive integrity
tar tzf /backups/uploads_20260126_030000.tar.gz > /dev/null

# Verify backup sizes are reasonable
du -sh /backups/*.gz
```

### Monitoring Backup Success

Add health check to verify recent backups exist:

```bash
#!/bin/bash
# Check if backup was created in last 48 hours
LATEST_DB_BACKUP=$(find /backups -name "db_*.sql.gz" -mtime -2 | wc -l)
if [ "$LATEST_DB_BACKUP" -eq 0 ]; then
    echo "WARNING: No recent database backup found!"
    # Send alert notification
fi
```

## Retention Policy

The backup script automatically deletes backups older than 180 days (6 months).

To customize retention:

```bash
# Edit backup.sh and change RETENTION_DAYS variable
RETENTION_DAYS=90  # 3 months
RETENTION_DAYS=365 # 1 year
```

## Backup Storage Requirements

Estimate storage needs:

```bash
# Check current database size
docker exec postgres psql -U buhapka -d buhapka -c "SELECT pg_size_pretty(pg_database_size('buhapka'));"

# Check uploads volume size
docker run --rm -v buhapka_uploads:/data alpine du -sh /data

# For 6-month retention with daily backups: ~180 backups
# Example: 100MB database + 500MB uploads = 600MB per day
# Total: 600MB × 180 days = ~108GB storage needed
```

## Troubleshooting

### Backup Script Fails

```bash
# Check if Docker is running
docker info

# Check if database container is running
docker ps | grep postgres

# Verify database credentials
docker exec postgres psql -U buhapka -d buhapka -c "SELECT 1;"

# Check disk space
df -h /backups
```

### Restore Fails

```bash
# Check PostgreSQL logs
docker logs postgres

# Verify backup file is not corrupted
gunzip -t /backups/db_20260126_030000.sql.gz

# Check PostgreSQL is accepting connections
docker exec postgres pg_isready -U buhapka
```

### Permission Issues

```bash
# Ensure backup script is executable
chmod +x scripts/backup.sh

# Ensure backup directory is writable
sudo chown -R $(whoami):$(whoami) /backups
chmod 755 /backups
```

## Email Notifications

To receive email notifications on backup completion:

1. Install mail utility:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mailutils

   # CentOS/RHEL
   sudo yum install mailx
   ```

2. Uncomment email section in `backup.sh`:
   ```bash
   if command -v mail > /dev/null 2>&1; then
       echo "Backup completed: $DATE" | mail -s "Buhapka Backup Success" admin@example.com
   fi
   ```

3. Configure mail server (SMTP) settings in `/etc/mail.rc` or use external SMTP relay.

## Security Considerations

- Store backups in a secure location with restricted permissions
- Consider encrypting backups containing sensitive data:
  ```bash
  gpg --symmetric --cipher-algo AES256 db_backup.sql.gz
  ```
- Use separate storage device or cloud storage for disaster recovery
- Regularly test restore procedures to ensure backups are functional
- Rotate backup encryption keys periodically
- Implement monitoring and alerting for backup failures
