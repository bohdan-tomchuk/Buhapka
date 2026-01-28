# Buhapka Scripts

This directory contains maintenance and operational scripts for the Buhapka application.

## Available Scripts

### backup.sh

Automated backup script for PostgreSQL database and uploads volume with 6-month retention policy.

**Features:**
- Backs up PostgreSQL database with gzip compression
- Backs up uploads volume (receipts and attachments)
- Automatic retention policy (180 days)
- Detailed logging with timestamps
- Error handling and Docker availability checks
- Configurable via environment variables

**Usage:**
```bash
# Run manual backup
./scripts/backup.sh

# With custom backup directory
BACKUP_DIR=/custom/path ./scripts/backup.sh

# With custom database settings
DB_CONTAINER=my-postgres DB_USER=myuser DB_NAME=mydb ./scripts/backup.sh
```

**Output:**
- Database backups: `/backups/db_YYYYMMDD_HHMMSS.sql.gz`
- Uploads backups: `/backups/uploads_YYYYMMDD_HHMMSS.tar.gz`
- Log file: `/backups/backup.log`

### restore.sh

Interactive restore script for database and uploads recovery.

**Features:**
- List available backups
- Restore database from backup
- Restore uploads from backup
- Restore complete system with single command
- Integrity verification before restore
- Safe confirmation prompts

**Usage:**
```bash
# List available backups
./scripts/restore.sh --list

# Restore database only
./scripts/restore.sh --database /backups/db_20260126_030000.sql.gz

# Restore uploads only
./scripts/restore.sh --uploads /backups/uploads_20260126_030000.tar.gz

# Restore complete system (both database and uploads)
./scripts/restore.sh --all 20260126_030000
```

## Setup Instructions

### 1. Create Backup Directory

```bash
sudo mkdir -p /backups
sudo chown $(whoami):$(whoami) /backups
chmod 755 /backups
```

### 2. Test Backup Script

```bash
./scripts/backup.sh
```

Verify backups were created:
```bash
ls -lh /backups/
```

### 3. Set Up Automated Backups

Create a cron job for daily backups at 3:00 AM:

```bash
# Open crontab editor
crontab -e

# Add this line (adjust path as needed)
0 3 * * * /path/to/Buhapka/scripts/backup.sh >> /backups/cron.log 2>&1
```

Verify cron job is scheduled:
```bash
crontab -l
```

### 4. Test Restore Procedure

```bash
# List backups
./scripts/restore.sh --list

# Test restore (use your actual backup filename)
./scripts/restore.sh --all 20260126_030000
```

## Environment Variables

Both scripts support the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `/backups` | Directory for storing backups |
| `DB_CONTAINER` | `postgres` | PostgreSQL Docker container name |
| `DB_USER` | `buhapka` | Database username |
| `DB_NAME` | `buhapka` | Database name |
| `UPLOADS_VOLUME` | `buhapka_uploads` | Docker volume for uploads |

## Backup Retention

The backup script automatically deletes backups older than 180 days (6 months).

To modify retention period, edit `backup.sh`:
```bash
RETENTION_DAYS=180  # Change this value
```

Common retention periods:
- 30 days: `RETENTION_DAYS=30`
- 90 days: `RETENTION_DAYS=90`
- 1 year: `RETENTION_DAYS=365`

## Backup Storage Estimation

Calculate required storage:

```bash
# Check current database size
docker exec postgres psql -U buhapka -d buhapka -c "SELECT pg_size_pretty(pg_database_size('buhapka'));"

# Check uploads volume size
docker run --rm -v buhapka_uploads:/data alpine du -sh /data
```

**Example calculation:**
- Database: 100 MB/day
- Uploads: 500 MB/day
- Total per day: 600 MB
- 180 days retention: 600 MB × 180 = ~108 GB

## Off-site Backups

For production environments, sync backups to remote storage:

### AWS S3
```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure

# Sync backups daily (add to cron)
aws s3 sync /backups/ s3://my-backup-bucket/buhapka/ --delete
```

### Rsync to Remote Server
```bash
# Sync backups to remote server
rsync -avz /backups/ user@backup-server:/remote/backups/buhapka/

# Add to cron (after backup.sh)
0 4 * * * rsync -avz /backups/ user@backup-server:/remote/backups/buhapka/
```

### Rclone (Multiple Cloud Providers)
```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure remote
rclone config

# Sync backups
rclone sync /backups/ remote:buhapka-backups/
```

## Monitoring and Alerts

### Backup Health Check

Create a monitoring script to verify recent backups:

```bash
#!/bin/bash
# Check if backup was created in last 48 hours
LATEST=$(find /backups -name "db_*.sql.gz" -mtime -2 | wc -l)
if [ "$LATEST" -eq 0 ]; then
    echo "WARNING: No recent backup found!"
    # Send alert (email, Slack, PagerDuty, etc.)
fi
```

### Email Notifications

Install mail utility and enable notifications in `backup.sh`:

```bash
# Ubuntu/Debian
sudo apt-get install mailutils

# Uncomment email section in backup.sh
if command -v mail > /dev/null 2>&1; then
    echo "Backup completed: $DATE" | mail -s "Buhapka Backup" admin@example.com
fi
```

## Security Best Practices

1. **Encrypt Backups** (for sensitive data):
   ```bash
   gpg --symmetric --cipher-algo AES256 /backups/db_20260126.sql.gz
   ```

2. **Restrict Permissions**:
   ```bash
   chmod 700 /backups
   chmod 600 /backups/*.gz
   ```

3. **Separate Storage**: Store backups on different physical disk/server

4. **Test Restores Regularly**: Verify backups work (monthly recommended)

5. **Monitor Backup Size**: Alert if backup size changes significantly

## Troubleshooting

### Backup Fails

```bash
# Check Docker is running
docker info

# Check database container
docker ps | grep postgres

# Check disk space
df -h /backups

# View backup logs
tail -f /backups/backup.log
```

### Restore Fails

```bash
# Check backup file integrity
gunzip -t /backups/db_20260126_030000.sql.gz
tar tzf /backups/uploads_20260126_030000.tar.gz

# Check PostgreSQL logs
docker logs postgres

# Verify database is ready
docker exec postgres pg_isready -U buhapka
```

### Permission Denied

```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix backup directory permissions
sudo chown -R $(whoami):$(whoami) /backups
chmod 755 /backups
```

## Additional Resources

- [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) - Comprehensive backup and restore guide
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Docker Volume Backups](https://docs.docker.com/storage/volumes/#back-up-restore-or-migrate-data-volumes)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in `/backups/backup.log`
3. Consult [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) for detailed procedures
