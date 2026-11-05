#!/usr/bin/env bash
# One time setup of northfid.com in Hestia, run as root once the domain's DNS
# points at this server. Safe to run again. Other sites aren't changed, and nginx
# is only reloaded if its whole configuration passes a test.
set -euo pipefail

HESTIA_USER=user
DOMAIN=northfid.com
ALIAS=www.northfid.com
HERE=$(cd "$(dirname "$0")" && pwd)
BIN=/usr/local/hestia/bin
CONF_DIR="/home/$HESTIA_USER/conf/web/$DOMAIN"

fail() { echo "ERROR: $1" >&2; exit 1; }

[ "$(id -u)" = 0 ] || fail "run this as root."
[ -x "$BIN/v-add-web-domain" ] || fail "Hestia is not installed."
ip=$(ip -4 route get 1.1.1.1 | awk '{for (i = 1; i < NF; i++) if ($i == "src") print $(i + 1)}')
for name in "$DOMAIN" "$ALIAS"; do
  # The last line skips any CNAME in the chain.
  [ "$(dig +short A "$name" | tail -1)" = "$ip" ] || fail "$name doesn't point at $ip yet."
done

"$BIN/v-list-web-domain" "$HESTIA_USER" "$DOMAIN" >/dev/null 2>&1 ||
  "$BIN/v-add-web-domain" "$HESTIA_USER" "$DOMAIN" "$ip" yes "$ALIAS"

[ -f "$CONF_DIR/ssl/$DOMAIN.pem" ] || "$BIN/v-add-letsencrypt-domain" "$HESTIA_USER" "$DOMAIN" "$ALIAS"
[ -f "$CONF_DIR/nginx.forcessl.conf" ] || "$BIN/v-add-web-domain-ssl-force" "$HESTIA_USER" "$DOMAIN"

install -m 644 "$HERE/nginx.ssl.conf_northfid" "$CONF_DIR/nginx.ssl.conf_northfid"
if ! nginx -t 2>/dev/null; then
  rm -f "$CONF_DIR/nginx.ssl.conf_northfid"
  fail "nginx rejected the configuration, so it was removed and nginx was not reloaded."
fi
systemctl reload nginx
echo "$DOMAIN is set up. It shows a bad gateway error until the first deploy."
