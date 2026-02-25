#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/phc}"
APP_NAME="${APP_NAME:-phc}"

echo "═══════════════════════════════════════"
echo " PHC MSDS - Deployment"
echo " Target directory: ${APP_DIR}"
echo " PM2 app name:     ${APP_NAME}"
echo "═══════════════════════════════════════"

cd "${APP_DIR}"

echo "▶ Step 1: Updating git repository..."
git fetch --all
git pull --ff-only

echo "▶ Step 2: Installing dependencies via pnpm..."
pnpm install --frozen-lockfile

echo "▶ Step 3: Generating Prisma Client..."
pnpm db:generate

echo "▶ Step 4: Building Next.js app..."
NODE_ENV=production pnpm build

echo "▶ Step 5: Restarting PM2 process..."
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 restart "${APP_NAME}"
else
  pm2 start "pnpm start -- -p 3000" --name "${APP_NAME}"
fi

pm2 save

echo ""
echo "✅ Deployment complete."
echo "Application should now be live."
echo "═══════════════════════════════════════"
