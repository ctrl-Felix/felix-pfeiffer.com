#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
umask 077
touch .env

for name in DB_SUPERUSER_PASSWORD DB_MIGRATOR_PASSWORD DB_APP_PASSWORD; do
  if ! grep -q "^$name=." .env; then
    sed -i "/^$name=/d" .env
    echo "$name=$(openssl rand -hex 24)" >> .env
    echo "created $name"
  fi
done

echo "Done. Add SMTP_HOST, SMTP_USER, SMTP_PASS and CONTACT_TO to .env if you want the contact form to send mail."
