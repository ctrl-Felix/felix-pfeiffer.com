#!/bin/sh
set -eu

password=$(cat /run/secrets/db_migrator_password)
case "$password" in
  "" | *[!A-Za-z0-9]*) echo "db_migrator_password must be non-empty and alphanumeric" >&2; exit 1 ;;
esac

export DATABASE_URL="postgres://portfolio_migrator:${password}@db:5432/portfolio?sslmode=disable"
exec dbmate --no-dump-schema --migrations-dir /db/migrations "$@"
