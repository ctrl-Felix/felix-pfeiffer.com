#!/bin/sh
input=$(cat)
case "$input" in
  *"git commit"*) npm run --silent tokens:update > /dev/null 2>&1 ;;
esac
exit 0
