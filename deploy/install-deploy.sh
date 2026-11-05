#!/usr/bin/env bash
# One time server setup for automatic deploys, run as root:
#   bash install-deploy.sh "<contents of the deploy key's .pub file>"
# Safe to run again, which is also how to update the server's scripts. It never
# changes nginx, other apps or an existing settings file.
set -euo pipefail

APP_USER=northfid
APP_PORT=3100
APP_DIR=/var/www/northfid
DATA_DIR=/var/lib/northfid
BACKUP_DIR=/var/backups/northfid
ENV_FILE=/etc/northfid.env
PM2_NAME=northfid
PUBLIC_KEY="${1:-}"
HERE=$(cd "$(dirname "$0")" && pwd)

fail() { echo "ERROR: $1" >&2; exit 1; }

[ "$(id -u)" = 0 ] || fail "run this as root."
[[ "$PUBLIC_KEY" =~ ^ssh-ed25519\ [A-Za-z0-9+/=]+(\ .*)?$ ]] || fail "pass the public key (ssh-ed25519 ...)."
for tool in node npm pm2 curl rsync flock sha256sum runuser openssl gcc make python3; do
  command -v "$tool" >/dev/null || fail "$tool is not installed."
done
if ss -ltnH 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$APP_PORT$" && ! pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  fail "port $APP_PORT is already in use by something else."
fi

login=$(sshd -T 2>/dev/null | awk '$1 == "permitrootlogin" { print $2 }' || true)
case "$login" in
  no) fail "sshd has PermitRootLogin no, so the deploy key could not log in." ;;
  '') echo "WARNING: could not read PermitRootLogin from sshd." >&2 ;;
esac

id "$APP_USER" >/dev/null 2>&1 || useradd --system --home-dir "$APP_DIR/home" --shell /usr/sbin/nologin "$APP_USER"

# nginx serves uploads directly. Identity documents and the database stay private to the app.
install -d -m 755 "$APP_DIR" "$APP_DIR/releases" "$APP_DIR/deps"
install -d -m 755 -o "$APP_USER" -g "$APP_USER" "$APP_DIR/home" "$DATA_DIR" "$DATA_DIR/uploads"
install -d -m 700 -o "$APP_USER" -g "$APP_USER" "$DATA_DIR/private-uploads" "$DATA_DIR/db"
install -d -m 700 "$BACKUP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  umask 077
  cat > "$ENV_FILE" <<CONF
DATABASE_URL=file:$DATA_DIR/db/northfid.db
PRIVATE_UPLOADS_DIR=$DATA_DIR/private-uploads
NEXTAUTH_URL=https://northfid.com
AUTH_TRUST_HOST=true
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
CRON_SECRET=$(openssl rand -hex 32)
EMAIL_FROM="Northfid <noreply@northfid.com>"
RESEND_API_KEY=
CONF
  umask 022
fi
chown "root:$APP_USER" "$ENV_FILE"
chmod 640 "$ENV_FILE"

# SSH commands run without a login shell, so record where node and pm2 are now.
tool_path="$(dirname "$(command -v node)"):$(dirname "$(command -v pm2)"):/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
cat > /etc/northfid-deploy.conf <<CONF
APP_USER=$APP_USER
APP_PORT=$APP_PORT
APP_DIR=$APP_DIR
DATA_DIR=$DATA_DIR
BACKUP_DIR=$BACKUP_DIR
ENV_FILE=$ENV_FILE
PM2_NAME=$PM2_NAME
LOCK_FILE=/run/northfid-deploy.lock
HEALTH_TRIES=30
HEALTH_WAIT=2
export HOME=/root
export PM2_HOME=/root/.pm2
export PATH="$tool_path"
CONF
chmod 600 /etc/northfid-deploy.conf
install -m 700 -o root -g root "$HERE/northfid-deploy.sh" /usr/local/sbin/northfid-deploy
install -m 700 -o root -g root "$HERE/northfid-backup.sh" /usr/local/sbin/northfid-backup
install -m 700 -o root -g root "$HERE/northfid-prices.sh" /usr/local/sbin/northfid-prices

# Daily backup, and live prices every 15 minutes.
cat > /etc/cron.d/northfid <<CRON
PATH=$tool_path
30 3 * * * root /usr/local/sbin/northfid-backup >> /var/log/northfid-backup.log 2>&1
*/15 * * * * root /usr/local/sbin/northfid-prices >> /var/log/northfid-prices.log 2>&1
CRON
chmod 644 /etc/cron.d/northfid

entry="restrict,command=\"/usr/local/sbin/northfid-deploy\" $PUBLIC_KEY"
mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
grep -qxF "$entry" /root/.ssh/authorized_keys || printf '%s\n' "$entry" >> /root/.ssh/authorized_keys

echo "Deploy script installed. This key can only run /usr/local/sbin/northfid-deploy."
