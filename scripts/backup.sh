#!/bin/bash

DATE=$(date +%F)
ARCHIVE_PATH="/tmp/backup_$DATE.tar.gz"
LOG_FILE="/tmp/backup_log.txt"

echo "🔄 Backup started: $DATE" >> "$LOG_FILE"

# Перевіряємо існування папки
if [ -d /var/data ]; then
  echo "✅ /var/data found. Creating archive..." >> "$LOG_FILE"
  tar -czf "$ARCHIVE_PATH" /var/data
  echo "📦 Archive created: $ARCHIVE_PATH" >> "$LOG_FILE"
else
  echo "❌ /var/data not found!" >> "$LOG_FILE"
  exit 1
fi

# Завантажуємо на Google Drive
if [ -f "$ARCHIVE_PATH" ]; then
  echo "☁ Uploading to Google Drive..." >> "$LOG_FILE"
  rclone --config /etc/secrets/rclone.conf copy "$ARCHIVE_PATH" backupdrive:/certlab_backups/
  echo "✅ Upload complete." >> "$LOG_FILE"
  rm "$ARCHIVE_PATH"
else
  echo "❌ Archive not found, skipping upload." >> "$LOG_FILE"
fi