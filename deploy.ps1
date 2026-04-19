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
$VM_DIR   = "/root/merit-launchers"

$ErrorActionPreference = "Stop"

Write-Host "==> Running mandatory QA before deploy..."
powershell -ExecutionPolicy Bypass -File .\deploy\run-qa.ps1
$env:MERIT_QA_ALREADY_RAN = '1'

Write-Host "==> Pushing to GitHub..."
$CURRENT_BRANCH = (git branch --show-current).Trim()
if ([string]::IsNullOrWhiteSpace($CURRENT_BRANCH)) {
    throw "Could not determine current Git branch."
}
git push origin $CURRENT_BRANCH

Write-Host "==> Updating runtime files on VM..."
$gitPullOutput = ssh $VM_ALIAS "cd $VM_DIR && if test -d .git; then git pull; else echo NO_GIT_CHECKOUT; fi"
if ($gitPullOutput -match "NO_GIT_CHECKOUT") {
    Write-Host "==> VM is not a Git checkout; syncing runtime files via tar stream..."
}
cmd /c "tar -cf - docker-compose.yml server\Dockerfile server\package.json server\package-lock.json server\src server\sql deploy/nginx/default.conf | ssh $VM_ALIAS ""cd $VM_DIR && tar -xf -"""

if ($Build) {
    Write-Host "==> Rebuilding and restarting api container..."
    ssh $VM_ALIAS "cd $VM_DIR && docker compose up -d --build api"
} else {
    Write-Host "==> Restarting api container (no rebuild)..."
    ssh $VM_ALIAS "cd $VM_DIR && docker compose restart api"
}

Write-Host "==> Running production API smoke test..."
powershell -ExecutionPolicy Bypass -File .\deploy\run-prod-smoke.ps1 -VmAlias $VM_ALIAS -VmDir $VM_DIR

Write-Host "==> Running production auth smoke test when QA credentials are configured..."
powershell -ExecutionPolicy Bypass -File .\deploy\run-prod-auth-smoke.ps1

if ($Web) {
    Write-Host "==> Building Flutter web bundle locally..."
    powershell -ExecutionPolicy Bypass -File .\deploy\build-admin-web.ps1

    Write-Host "==> Uploading web bundle to VM via tar stream..."
    cmd /c "tar -cf - -C deploy\admin-web . | ssh $VM_ALIAS ""cd $VM_DIR/deploy/admin-web && tar -xf -"""

    Write-Host "==> Normalizing web bundle permissions and restarting nginx..."
    ssh $VM_ALIAS "cd $VM_DIR && find deploy/admin-web -type d -exec chmod 755 {} + && find deploy/admin-web -type f -exec chmod 644 {} + && docker compose restart nginx"

    Write-Host "==> Running production web smoke test..."
    powershell -ExecutionPolicy Bypass -File .\deploy\run-prod-web-smoke.ps1
}

Write-Host ""
Write-Host "==> Done."
