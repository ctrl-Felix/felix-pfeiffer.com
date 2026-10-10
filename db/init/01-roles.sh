#!/bin/sh
set -eu

exec psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v migrator_password="${DB_MIGRATOR_PASSWORD:?DB_MIGRATOR_PASSWORD is not set}" \
  -v app_password="${DB_APP_PASSWORD:?DB_APP_PASSWORD is not set}" \
  -f /db/roles.sql
