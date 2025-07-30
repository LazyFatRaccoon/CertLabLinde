#!/bin/bash

# Дата у форматі YYYY-MM-DD
DATE=$(date +%F)

# Архівуємо всю папку /var/data
ARCHIVE_PATH="/tmp/backup_$DATE.tar.gz"
tar -czf "$ARCHIVE_PATH" /var/data

# Завантажуємо в Google Drive у папку certlab_backups
rclone copy "$ARCHIVE_PATH" backupdrive:/certlab_backups/

# Прибираємо локальний архів
rm "$ARCHIVE_PATH"