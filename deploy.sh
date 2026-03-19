#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# deploy.sh  –  push local changes and redeploy on the VM
#
# Usage:
#   ./deploy.sh                  # restart api only (code changes)
#   ./deploy.sh --build          # rebuild api image (package.json changed)
#   ./deploy.sh --web            # scp Flutter web build + reload nginx
#   ./deploy.sh --build --web    # rebuild api AND push web
# ---------------------------------------------------------------------------

set -e

VM_USER="joy"          # ← change this
VM_HOST="163.61.38.40"        # ← change this (IP or hostname)
VM_DIR="~/merit-launchers"  # ← change if your repo lives elsewhere

BUILD=false
WEB=false

for arg in "$@"; do
  case $arg in
    --build) BUILD=true ;;
    --web)   WEB=true   ;;
  esac
done

echo "==> Pushing to GitHub..."
git push origin main

echo "==> Pulling on VM..."
ssh "$VM_USER@$VM_HOST" "cd $VM_DIR && git pull"

if [ "$BUILD" = true ]; then
  echo "==> Rebuilding and restarting api container..."
  ssh "$VM_USER@$VM_HOST" "cd $VM_DIR && docker compose up -d --build api"
else
  echo "==> Restarting api container (no rebuild)..."
  ssh "$VM_USER@$VM_HOST" "cd $VM_DIR && docker compose restart api"
fi

if [ "$WEB" = true ]; then
  echo "==> Building Flutter web bundle locally..."
  powershell.exe -ExecutionPolicy Bypass -File ./deploy/build-admin-web.ps1

  echo "==> Uploading web bundle to VM..."
  scp -r ./deploy/admin-web/* "$VM_USER@$VM_HOST:$VM_DIR/deploy/admin-web/"

  echo "==> Reloading nginx..."
  ssh "$VM_USER@$VM_HOST" "cd $VM_DIR && docker compose exec nginx nginx -s reload"
fi

echo ""
echo "==> Done."
