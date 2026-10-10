#!/bin/sh
set -eu

password=${DB_MIGRATOR_PASSWORD:-}
if [ -z "$password" ]; then
  echo "DB_MIGRATOR_PASSWORD is not set" >&2
  exit 1
fi

encoded=""
rest=$password
while [ -n "$rest" ]; do
  rest_after=${rest#?}
  character=${rest%"$rest_after"}
  rest=$rest_after
  case "$character" in
    [A-Za-z0-9._~-]) encoded="$encoded$character" ;;
    *) encoded="$encoded$(printf '%%%02X' "'$character")" ;;
  esac
done

export DATABASE_URL="postgres://portfolio_migrator:${encoded}@db:5432/portfolio?sslmode=disable"
exec dbmate --no-dump-schema --wait --wait-timeout 90s --migrations-dir /db/migrations "$@"
