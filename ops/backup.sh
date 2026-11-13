#!/usr/bin/env bash
set -euo pipefail

: "${MYSQL_DATABASE:=danci}"
: "${BACKUP_DIR:=./backups}"
: "${IMAGE_DIR:=./generated}"
mkdir -p "$BACKUP_DIR"
stamp="$(date +%Y%m%d-%H%M%S)"
mysqldump --single-transaction "$MYSQL_DATABASE" > "$BACKUP_DIR/${MYSQL_DATABASE}-${stamp}.sql"
tar -czf "$BACKUP_DIR/generated-${stamp}.tar.gz" "$IMAGE_DIR"
