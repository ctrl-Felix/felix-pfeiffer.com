#!/bin/sh
set -eu

migrator_password=$(cat /run/secrets/db_migrator_password)
app_password=$(cat /run/secrets/db_app_password)

exec psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v migrator_password="$migrator_password" -v app_password="$app_password" \
  -f /db/roles.sql
