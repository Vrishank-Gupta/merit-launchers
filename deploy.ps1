# ---------------------------------------------------------------------------
# deploy.ps1  -  push local changes and redeploy on the VM
#
# Usage:
#   .\deploy.ps1                  # restart api only (code changes)
#   .\deploy.ps1 -Build           # rebuild api image (package.json changed)
#   .\deploy.ps1 -Web             # scp Flutter web build + reload nginx
#   .\deploy.ps1 -Build -Web      # rebuild api AND push web
# ---------------------------------------------------------------------------

param(
    [switch]$Build,
    [switch]$Web
)

$VM_ALIAS = "myvps"
$VM_DIR   = "/home/joy/merit-launchers"

$ErrorActionPreference = "Stop"

Write-Host "==> Pushing to GitHub..."
git push origin main

Write-Host "==> Pulling on VM..."
ssh $VM_ALIAS "cd $VM_DIR && git pull"

if ($Build) {
    Write-Host "==> Rebuilding and restarting api container..."
    ssh $VM_ALIAS "cd $VM_DIR && docker compose up -d --build api"
} else {
    Write-Host "==> Restarting api container (no rebuild)..."
    ssh $VM_ALIAS "cd $VM_DIR && docker compose restart api"
}

if ($Web) {
    Write-Host "==> Building Flutter web bundle locally..."
    powershell -ExecutionPolicy Bypass -File .\deploy\build-admin-web.ps1

    Write-Host "==> Uploading web bundle to VM..."
    scp -r .\deploy\admin-web\* "${VM_ALIAS}:${VM_DIR}/deploy/admin-web/"

    Write-Host "==> Reloading nginx..."
    ssh $VM_ALIAS "cd $VM_DIR && docker compose exec nginx nginx -s reload"
}

Write-Host ""
Write-Host "==> Done."
