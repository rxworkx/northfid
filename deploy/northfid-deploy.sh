#!/usr/bin/env bash
# The server's deploy script, run by GitHub Actions through an SSH key that can
# run nothing else. Installed to /usr/local/sbin/northfid-deploy by
# install-deploy.sh, so changing this file has no effect until the installer is
# run again.
#
# Reads the built release as a .tgz on stdin. The live app isn't touched until
# the release is unpacked, its packages are ready and the database is backed up.
set -euo pipefail

CONF=${NORTHFID_DEPLOY_CONF:-/etc/northfid-deploy.conf}
# shellcheck disable=SC1090
. "$CONF"

command_line="${SSH_ORIGINAL_COMMAND:-}"
if [[ ! "$command_line" =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  echo "Only 'deploy <commit>' is allowed." >&2
  exit 64
fi
sha="${BASH_REMATCH[1]}"

exec 9>"$LOCK_FILE"
flock -w 600 9

work=$(mktemp -d)
release="$APP_DIR/releases/$sha"
trap 'rm -rf "$work"' EXIT

as_app() { runuser -u "$APP_USER" -- env HOME="$APP_DIR/home" npm_config_cache="$APP_DIR/home/.npm" "$@"; }

# pm2 output stays out of the log: the workflow's logs can be public.
start_app() {
  local dir=$1
  pm2 delete "$PM2_NAME" >/dev/null 2>&1 || true
  pm2 start "$dir/node_modules/next/dist/bin/next" --name "$PM2_NAME" --cwd "$dir" \
    --uid "$APP_USER" --gid "$APP_USER" --max-memory-restart 700M \
    -- start -H 127.0.0.1 -p "$APP_PORT" >/dev/null
}

app_healthy() {
  for _ in $(seq 1 "$HEALTH_TRIES"); do
    if curl -fsS -m 5 -o /dev/null "http://127.0.0.1:$APP_PORT/login" 2>/dev/null; then
      return 0
    fi
    sleep "$HEALTH_WAIT"
  done
  return 1
}

# Check the upload before changing anything.
head -c 524288000 > "$work/release.tgz"
mkdir "$work/release"
tar --no-same-owner --no-same-permissions -xzf "$work/release.tgz" -C "$work/release"
for file in .next/BUILD_ID package-lock.json prisma/schema.prisma; do
  [ -f "$work/release/$file" ] || { echo "The upload has no $file." >&2; exit 65; }
done

# Packages and the Prisma client depend only on these two files, so most deploys
# reuse the existing ones. Installed as the app user, because install scripts
# from npm packages shouldn't run as root.
deps_key=$(cat "$work/release/package-lock.json" "$work/release/prisma/schema.prisma" | sha256sum | cut -d' ' -f1)
deps="$APP_DIR/deps/$deps_key"
if [ ! -d "$deps/node_modules" ]; then
  echo "Installing packages"
  rm -rf "$deps"
  install -d -o "$APP_USER" -g "$APP_USER" "$deps" "$deps/prisma"
  install -o "$APP_USER" -g "$APP_USER" -m 644 \
    "$work/release/package.json" "$work/release/package-lock.json" "$work/release/prisma.config.ts" "$deps/"
  install -o "$APP_USER" -g "$APP_USER" -m 644 "$work/release/prisma/schema.prisma" "$deps/prisma/"
  # Downloads can fail briefly, so try a few times before giving up.
  installed=false
  for attempt in 1 2 3; do
    if (cd "$deps" && as_app npm ci --no-audit --no-fund >/dev/null 2>&1 && as_app node_modules/.bin/prisma generate >/dev/null 2>&1); then
      installed=true
      break
    fi
    echo "Package install attempt $attempt failed." >&2
    sleep 20
  done
  if [ "$installed" = false ]; then
    rm -rf "$deps"
    echo "Could not install packages. The live app was not touched." >&2
    exit 66
  fi
fi

# A redeploy of the same commit replaces its release, but never the running one.
previous=$(readlink -f "$APP_DIR/current" 2>/dev/null || true)
if [ "$previous" = "$release" ]; then
  mv "$release" "$release.old.$$"
  previous="$release.old.$$"
fi
rm -rf "$release"
mkdir -p "$APP_DIR/releases"
mv "$work/release" "$release"

# Files that must outlive a release are links to outside the release folder.
ln -s "$deps/node_modules" "$release/node_modules"
ln -s "$ENV_FILE" "$release/.env"
# The bundled trader photos seed the shared folder on the first deploy only.
if [ ! -d "$DATA_DIR/uploads/traders" ] && [ -d "$release/public/uploads/traders" ]; then
  cp -r "$release/public/uploads/traders" "$DATA_DIR/uploads/traders"
  chown -R "$APP_USER:$APP_USER" "$DATA_DIR/uploads/traders"
fi
rm -rf "$release/public/uploads"
ln -s "$DATA_DIR/uploads" "$release/public/uploads"
chmod -R a+rX "$release"
chown -R "$APP_USER:$APP_USER" "$release/.next"

if [ -f "$DATA_DIR/db/northfid.db" ] && [ -e "$APP_DIR/current" ]; then
  echo "Backing up the database"
  /usr/local/sbin/northfid-backup "pre-deploy-${sha:0:12}" >/dev/null
fi

# Without --accept-data-loss this stops rather than dropping data, and the app
# keeps running the previous version.
echo "Updating the database schema"
if ! (cd "$release" && as_app node_modules/.bin/prisma db push >"$work/push.log" 2>&1); then
  sed -nE 's/^.*(data loss|Error:).*$/\0/p' "$work/push.log" | head -5 >&2
  rm -rf "$release"
  [ "${previous:-}" = "$release.old.$$" ] && mv "$previous" "$release"
  echo "The schema change was refused, nothing was deployed." >&2
  exit 67
fi

echo "Restarting $PM2_NAME"
start_app "$release"
if ! app_healthy; then
  echo "Deploy failed, restoring the previous version." >&2
  pm2 delete "$PM2_NAME" >/dev/null 2>&1 || true
  if [ -n "$previous" ] && [ -d "$previous" ]; then
    if [ "$previous" = "$release.old.$$" ]; then
      rm -rf "$release"
      mv "$previous" "$release"
      previous="$release"
    else
      rm -rf "$release"
    fi
    start_app "$previous"
    if app_healthy; then
      echo "Previous version restored and healthy." >&2
    else
      echo "Previous version is NOT healthy. Check the server." >&2
    fi
    pm2 save >/dev/null
  else
    rm -rf "$release"
  fi
  exit 1
fi

ln -sfn "$release" "$APP_DIR/current.new"
mv -T "$APP_DIR/current.new" "$APP_DIR/current"
pm2 save >/dev/null

# Keep the three newest releases for manual rollback, and only the packages they use.
rm -rf "$release".old.*
ls -1dt "$APP_DIR"/releases/* | tail -n +4 | xargs -r rm -rf
for dir in "$APP_DIR"/deps/*; do
  in_use=false
  for link in "$APP_DIR"/releases/*/node_modules; do
    [ "$(readlink "$link")" = "$dir/node_modules" ] && in_use=true
  done
  [ "$in_use" = true ] || rm -rf "$dir"
done

echo "Deployed $sha"
