#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Installing dependencies..."
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "🚀 Starting in DEV mode (npm run dev)..."
# Uses tsx watch per package.json -> src/app/index.ts
npm run dev
