#!/usr/bin/env bash
set -euo pipefail

ZIP_NAME="app.zip"

# ลบ zip เดิม
rm -f "$ZIP_NAME"

# zip ทั้งโปรเจกต์ ยกเว้น dist (และของกวนใจ)
zip -r "$ZIP_NAME" . \
  -x "dist/*" \
  -x ".git/*" \
  -x "node_modules/*" \
  -x "*.zip" \
  -x ".DS_Store" \
  -x "scripts/*.sh~" \
  -x "README.md~"

echo "✅ Created $ZIP_NAME (excluded: dist, node_modules, .git)"
