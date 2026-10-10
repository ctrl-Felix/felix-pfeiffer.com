#!/bin/sh
set -eu

password=${DB_MIGRATOR_PASSWORD:-}
case "$password" in
  "" | *[!A-Za-z0-9]*) echo "DB_MIGRATOR_PASSWORD must be non-empty and alphanumeric" >&2; exit 1 ;;
esac

export DATABASE_URL="postgres://portfolio_migrator:${password}@db:5432/portfolio?sslmode=disable"
exec dbmate --no-dump-schema --migrations-dir /db/migrations "$@"
