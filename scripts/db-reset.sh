#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$ROOT_DIR/.env" ]; then
  export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

echo "WARNING: This will DROP and recreate the database. Dev only!"
read -p "Continue? [y/N]: " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

DB_NAME="${DATABASE_URL##*/}"
DB_NAME="${DB_NAME%%\?*}"

echo "Dropping database: $DB_NAME"
psql "${DATABASE_URL%/$DB_NAME}" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
echo "Creating database: $DB_NAME"
psql "${DATABASE_URL%/$DB_NAME}" -c "CREATE DATABASE \"$DB_NAME\";"

echo "Running migrations..."
bash "$SCRIPT_DIR/db-migrate.sh"

echo "Running seeds..."
bash "$SCRIPT_DIR/db-seed.sh"

echo "Database reset complete."
