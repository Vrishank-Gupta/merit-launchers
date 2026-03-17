#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$REPO_ROOT/build/web"
TARGET_DIR="$REPO_ROOT/deploy/admin-web"
MARKETING_SOURCE="$REPO_ROOT/deploy/marketing-site"
PORTAL_TARGET="$TARGET_DIR/portal"
ADMIN_TARGET="$TARGET_DIR/admin"
MARKETING_TARGET="$TARGET_DIR/marketing"

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -R "$MARKETING_SOURCE"/. "$TARGET_DIR"/

rm -rf "$BUILD_DIR"
flutter build web --dart-define=APP_ENV=dev --base-href /portal/
mkdir -p "$PORTAL_TARGET"
cp -R "$BUILD_DIR"/. "$PORTAL_TARGET"/

rm -rf "$BUILD_DIR"
flutter build web --dart-define=APP_ENV=dev --base-href /admin/
mkdir -p "$ADMIN_TARGET"
cp -R "$BUILD_DIR"/. "$ADMIN_TARGET"/

rm -rf "$BUILD_DIR"
flutter build web --dart-define=APP_ENV=dev --base-href /marketing/
mkdir -p "$MARKETING_TARGET"
cp -R "$BUILD_DIR"/. "$MARKETING_TARGET"/

echo "Marketing site, student portal, admin portal, and marketing console copied to $TARGET_DIR"
