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

[ -e secrets/smtp_password ] || : > secrets/smtp_password

chmod 444 secrets/*
echo "Done. Put the SMTP password into secrets/smtp_password. Never commit the secrets directory."
