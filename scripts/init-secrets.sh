#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
umask 077
mkdir -p secrets
chmod 700 secrets

for name in db_superuser_password db_migrator_password db_app_password; do
  if [ ! -s "secrets/$name" ]; then
    openssl rand -hex 24 | tr -d '\n' > "secrets/$name"
    echo "created secrets/$name"
  fi
done

for name in smtp_password twelve_data_api_key; do
  [ -e "secrets/$name" ] || : > "secrets/$name"
done

chmod 444 secrets/*
echo "Done. Put the SMTP password into secrets/smtp_password and your Twelve Data API key into secrets/twelve_data_api_key. Never commit the secrets directory."
