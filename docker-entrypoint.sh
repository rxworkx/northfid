#!/bin/sh
set -e

# The project has no migrations folder, so the schema is synced with db push.
# Without --accept-data-loss this stops rather than dropping data.
node_modules/.bin/prisma db push

exec node_modules/.bin/next start
