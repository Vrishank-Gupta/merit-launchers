#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$REPO_ROOT/build/web"
TARGET_DIR="$REPO_ROOT/deploy/admin-web"
MARKETING_DIR="$REPO_ROOT/marketing"
MARKETING_SOURCE="$REPO_ROOT/deploy/marketing-site"
PORTAL_TARGET="$TARGET_DIR/portal"
ADMIN_TARGET="$TARGET_DIR/admin"
MARKETING_TARGET="$TARGET_DIR/marketing"

disable_service_worker_bootstrap() {
  local app_dir="$1"
  local bootstrap_path="$app_dir/flutter_bootstrap.js"
  if [[ ! -f "$bootstrap_path" ]]; then
    return
  fi

  python3 - <<'PY' "$bootstrap_path"
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
updated = re.sub(
    r'serviceWorkerSettings:\s*\{\s*serviceWorkerVersion:\s*"[^"]+"\s*\}',
    'serviceWorkerSettings: null',
    text,
    count=1,
)
path.write_text(updated, encoding="utf-8")
PY
}

install_service_worker_kill_switch() {
  local app_dir="$1"
  cat > "$app_dir/flutter_service_worker.js" <<'EOF'
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    if (self.caches && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map(function (key) { return caches.delete(key); }));
    }
    if (self.registration && self.registration.unregister) {
      await self.registration.unregister();
    }
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.navigate(client.url);
    }
  })());
});

self.addEventListener('fetch', function () {
  return;
});
EOF
}

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
disable_service_worker_bootstrap "$PORTAL_TARGET"
install_service_worker_kill_switch "$PORTAL_TARGET"

rm -rf "$BUILD_DIR"
flutter build web --dart-define=APP_ENV=prod --base-href /admin/
mkdir -p "$ADMIN_TARGET"
cp -R "$BUILD_DIR"/. "$ADMIN_TARGET"/
disable_service_worker_bootstrap "$ADMIN_TARGET"
install_service_worker_kill_switch "$ADMIN_TARGET"

rm -rf "$BUILD_DIR"
flutter build web --dart-define=APP_ENV=prod --base-href /marketing/
mkdir -p "$MARKETING_TARGET"
cp -R "$BUILD_DIR"/. "$MARKETING_TARGET"/
disable_service_worker_bootstrap "$MARKETING_TARGET"
install_service_worker_kill_switch "$MARKETING_TARGET"

echo "Marketing site, student portal, admin portal, and marketing console copied to $TARGET_DIR"
