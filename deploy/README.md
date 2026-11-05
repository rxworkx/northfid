# Automatic deploys

Every push to `main` builds the app on GitHub. If it builds, the workflow sends the release to the server, which installs any new packages, backs up the database, updates its schema, restarts `northfid` and checks it. Other apps on the server are not touched.

If the new version fails its health check, the server goes back to the previous one and the workflow run shows as failed. If a schema change would lose data, the deploy stops before restarting anything.

## How it runs on the server

| What | Where |
| --- | --- |
| Releases | `/var/www/northfid/releases/<commit>`, with `/var/www/northfid/current` pointing at the live one |
| Settings | `/etc/northfid.env` |
| Database | `/var/lib/northfid/db/northfid.db` |
| Public uploads | `/var/lib/northfid/uploads`, served by nginx |
| Identity documents | `/var/lib/northfid/private-uploads`, only through the app |
| Backups | `/var/backups/northfid`, daily at 03:30 and before each deploy |
| App | pm2 process `northfid` on `127.0.0.1:3100`, running as the `northfid` user |

The Docker and Caddy files in the repo aren't used here.

## Setup

Do this once, after this folder has been pushed. Pushes only build until step 7.

1. On your own computer, create a key used only for deploys, with no passphrase:

   ```bash
   ssh-keygen -t ed25519 -N '' -C northfid-deploy -f ~/.ssh/northfid-deploy
   cat ~/.ssh/northfid-deploy.pub
   ```

2. Point the domain at the server. At the DNS provider, set `A` records for `@` and `www` to the server's IP address, and remove the parking records. Wait until `dig +short northfid.com` shows the server's IP.

3. On the server, as root, get this folder and install the deploy script. This doesn't change any running app:

   ```bash
   mkdir -p /root/northfid-setup
   curl -fsSL https://github.com/rxworkx/northfid/archive/refs/heads/main.tar.gz | tar -xz --strip-components=1 -C /root/northfid-setup northfid-main/deploy
   bash /root/northfid-setup/deploy/install-deploy.sh "PASTE THE .pub LINE HERE"
   ```

   If the repo is private, copy the `deploy` folder across with `scp -r deploy root@<server IP>:/root/northfid-setup/` instead of using `curl`.

4. Set up the domain and its HTTPS certificate:

   ```bash
   bash /root/northfid-setup/deploy/setup-domain.sh
   ```

5. Edit `/etc/northfid.env` and fill in `RESEND_API_KEY`. The secrets in it were generated for you. Password reset and verification emails need the key, and the domain verified in Resend.

6. In the GitHub repo, go to Settings, Secrets and variables, Actions, and add these repository secrets:

   | Secret | Value |
   | --- | --- |
   | `VPS_HOST` | The server's IP address |
   | `VPS_SSH_KEY` | The whole of `~/.ssh/northfid-deploy`, the file without `.pub` |
   | `VPS_KNOWN_HOSTS` | The output of `ssh-keyscan -t ed25519 <server IP>` |

   Check the `ssh-keyscan` fingerprint with `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the server.

7. On the same page, add a repository variable named `DEPLOY_ENABLED` with the value `true`.

8. Open the Actions tab, select the latest Deploy run, and re-run it.

9. Add the starting data and your admin account. Read the password in without it reaching your shell history:

    ```bash
    cd /var/www/northfid/current
    read -rs -p 'Admin password (12 or more characters): ' SEED_ADMIN_PASSWORD; echo
    runuser -u northfid -- env HOME=/var/www/northfid/home npm_config_cache=/var/www/northfid/home/.npm \
      NODE_ENV=production SEED_ADMIN_EMAIL=you@yourdomain.com SEED_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" npm run db:seed
    unset SEED_ADMIN_PASSWORD
    ```

    Run this once. Running it again resets the admin password to the one you give it.

## Everyday use

- **To deploy:** push to `main`. Keep unfinished work on another branch, because every push to `main` goes live.
- **To undo a bad deploy:** revert the commit and push. If the bad version changed the database, restore a backup too.
- **To pause deploys:** set `DEPLOY_ENABLED` to `false`. Do this before any manual server work.
- **After changing a script in this folder:** repeat step 3. The server keeps its own copy, so a push alone doesn't change it. Changing `/etc/northfid.env` needs `pm2 restart northfid`.
- **To see logs:** `pm2 logs northfid`.

## Good to know

- If this repo is public, workflow logs are public too. Never print settings or secrets from a step.
- A schema change that would lose data is refused every time. To make one on purpose, take a backup, then run `prisma db push --accept-data-loss` by hand from `/var/www/northfid/current` as the `northfid` user.
- A rollback restores the code, not the database. Schema changes that already applied stay applied.
- Backups are on the same disk as the app, so also copy them off the server regularly. They contain identity documents, so store them securely.
