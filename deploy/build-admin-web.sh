#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$REPO_ROOT/build/web"
TARGET_DIR="$REPO_ROOT/deploy/admin-web"

flutter build web --dart-define=APP_ENV=dev
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -R "$BUILD_DIR"/. "$TARGET_DIR"/

echo "Admin web build copied to $TARGET_DIR"
