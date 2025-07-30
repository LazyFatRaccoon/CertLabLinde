#!/bin/bash

echo "🔽 Завантаження rclone..."
curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip

echo "📦 Розпаковка..."
unzip -o rclone-current-linux-amd64.zip

echo "🚚 Переміщення..."
mv rclone-*-linux-amd64/rclone ./scripts/rclone
chmod +x ./scripts/rclone

echo "✅ Rclone готовий: scripts/rclone"