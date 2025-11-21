#!/usr/bin/env bash
set -euo pipefail

RG="treasure-rg"
APP="sainam-online-discord"
ZIP="app.zip"

bash ./scripts/make-zip.sh

# ให้ Kudu/Oryx ติดตั้ง deps ตอนดีพลอย และติดตั้ง devDeps ด้วย (ต้องใช้ถ้าจะ `npm run dev`)
az webapp config appsettings set -g "$RG" -n "$APP" --settings \
  SCM_DO_BUILD_DURING_DEPLOYMENT=true \
  NPM_CONFIG_PRODUCTION=false

# ตั้ง Startup Command ให้รัน npm run dev หลัง deploy (ทำครั้งแรกก็พอ)
az webapp config set -g "$RG" -n "$APP" --startup-file "npm run dev"

# deploy zip
az webapp deploy -g "$RG" -n "$APP" --src-path "$ZIP" --type zip

echo "🚀 Deploy submitted. App Service will start with: npm run dev"
