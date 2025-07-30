#!/bin/bash

# Абсолютний шлях до цієї директорії
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Шлях до rclone
RCLONE="$SCRIPT_DIR/rclone"

# Перевірка наявності rclone
if [ ! -f "$RCLONE" ]; then
  echo "🔄 rclone не знайдено — завантажую..."
  cd "$SCRIPT_DIR"
  curl -sO https://downloads.rclone.org/rclone-current-linux-amd64.zip
  unzip -o rclone-current-linux-amd64.zip
  mkdir -p rclone_tmp
  mv rclone-*-linux-amd64/rclone ./rclone_tmp/
  chmod +x ./rclone_tmp/rclone
  mv ./rclone_tmp/rclone ./rclone
  rm -rf rclone_tmp rclone-current-linux-amd64.zip rclone-*-linux-amd64
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
  "$RCLONE" --config /etc/secrets/RCLONE_CONF copy "$ARCHIVE_PATH" backupdrive:/certlab_backups/
  echo "✅ Upload complete." >> "$LOG_FILE"
  rm "$ARCHIVE_PATH"
else
  echo "❌ Archive not found, skipping upload." >> "$LOG_FILE"
fi