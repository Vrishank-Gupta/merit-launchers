#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-24}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:-}}"

mkdir -p "$BACKUP_DIR"

echo "[postgres-backup] waiting for database ${POSTGRES_HOST}:${POSTGRES_PORT}"
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  sleep 3
done

dump_once() {
  timestamp="$(date +%Y-%m-%d-%H%M%S)"
  target="$BACKUP_DIR/${POSTGRES_DB}-${timestamp}.sql"
  echo "[postgres-backup] creating $target"
  pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB" > "$target"
  gzip -f "$target"
  find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$BACKUP_RETENTION_DAYS" -delete
}

dump_once

while true; do
  sleep "$((BACKUP_INTERVAL_HOURS * 3600))"
  dump_once
done
