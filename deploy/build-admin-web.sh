#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$REPO_ROOT/build/web"
TARGET_DIR="$REPO_ROOT/deploy/admin-web"
MARKETING_DIR="$REPO_ROOT/marketing"
MARKETING_SOURCE="$REPO_ROOT/deploy/marketing-site"
PORTAL_TARGET="$TARGET_DIR/portal"
ADMIN_TARGET="$TARGET_DIR/admin"

# Build React marketing site → deploy/marketing-site/
echo "==> Building React marketing site..."
cd "$MARKETING_DIR"
npm install --silent
npm run build
rm -rf "$MARKETING_SOURCE"
mkdir -p "$MARKETING_SOURCE"
cp -R dist/. "$MARKETING_SOURCE"/
cd "$REPO_ROOT"

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -R "$MARKETING_SOURCE"/. "$TARGET_DIR"/

rm -rf "$BUILD_DIR"
flutter build web --dart-define=APP_ENV=prod --base-href /portal/
mkdir -p "$PORTAL_TARGET"
cp -R "$BUILD_DIR"/. "$PORTAL_TARGET"/

rm -rf "$BUILD_DIR"
flutter build web --dart-define=APP_ENV=prod --base-href /admin/
mkdir -p "$ADMIN_TARGET"
cp -R "$BUILD_DIR"/. "$ADMIN_TARGET"/

echo "Marketing site, student portal, and admin portal copied to $TARGET_DIR"
