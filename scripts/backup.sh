#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RCLONE="$SCRIPT_DIR/rclone/rclone"

if [ ! -f "$RCLONE" ]; then
  echo "rclone не знайдено — завантажую..."
  cd "$SCRIPT_DIR"
  curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip
  unzip -o rclone-current-linux-amd64.zip
  mv rclone-*-linux-amd64/rclone ./rclone/rclone
  chmod +x ./rclone/rclone
  rm -rf rclone-current-linux-amd64.zip rclone-*-linux-amd64
  cd -
fi

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
  "$RCLONE" --config /etc/secrets/rclone.conf copy "$ARCHIVE_PATH" backupdrive:/certlab_backups/
  echo "✅ Upload complete." >> "$LOG_FILE"
  rm "$ARCHIVE_PATH"
else
  echo "❌ Archive not found, skipping upload." >> "$LOG_FILE"
fi