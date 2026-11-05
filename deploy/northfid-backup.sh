#!/usr/bin/env bash
# Backs up the database and uploaded files to BACKUP_DIR, and removes daily
# backups after 14 days. These contain identity documents, so they stay private
# to root. Installed to /usr/local/sbin/northfid-backup by install-deploy.sh.
set -euo pipefail

CONF=${NORTHFID_DEPLOY_CONF:-/etc/northfid-deploy.conf}
# shellcheck disable=SC1090
. "$CONF"

label=${1:-daily-$(date +%F)}
db="$DATA_DIR/db/northfid.db"
target="$BACKUP_DIR/$label.db"
umask 077

# The online backup API gives a consistent copy while the app is writing.
cd "$APP_DIR/current"
node -e '
  const [db, target] = process.argv.slice(1);
  require("better-sqlite3")(db, { readonly: true }).backup(target).catch((e) => { console.error(e); process.exit(1); });
' "$db" "$target"

rsync -a --delete "$DATA_DIR/uploads/" "$BACKUP_DIR/uploads/"
rsync -a --delete "$DATA_DIR/private-uploads/" "$BACKUP_DIR/private-uploads/"
find "$BACKUP_DIR" -maxdepth 1 -name '*.db' -mtime +14 -delete
echo "Backed up to $target"
