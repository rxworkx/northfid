#!/usr/bin/env bash
# Asks the app to refresh live prices. The secret goes to curl on stdin, so it
# never appears in a process list. Installed to /usr/local/sbin/northfid-prices.
set -euo pipefail

CONF=${NORTHFID_DEPLOY_CONF:-/etc/northfid-deploy.conf}
# shellcheck disable=SC1090
. "$CONF"
# shellcheck disable=SC1090
. "$ENV_FILE"

printf 'header = "Authorization: Bearer %s"\n' "$CRON_SECRET" |
  curl -fsS -m 60 -o /dev/null -X POST -K - "http://127.0.0.1:$APP_PORT/api/prices/update"
