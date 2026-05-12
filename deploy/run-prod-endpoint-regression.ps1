param(
  [string]$VmAlias = "myvps",
  [string]$VmDir = "/root/merit-launchers"
)

$ErrorActionPreference = "Stop"

$remoteCommand = @"
set -euo pipefail
QA_ENV_FILE='$VmDir/deploy/vps-qa.env'
if [ -f ""$QA_ENV_FILE"" ]; then
  set -a
  . ""$QA_ENV_FILE""
  set +a
fi
cd '$VmDir'
if [ -n ""${CMS_ADMIN_EMAIL:-}"" ] && [ -n ""${CMS_ADMIN_PASSWORD:-}"" ]; then
  CMS_ADMIN_EMAIL=""$CMS_ADMIN_EMAIL"" CMS_ADMIN_PASSWORD=""$CMS_ADMIN_PASSWORD"" SWEEP_BASE_URL='http://127.0.0.1:8080' docker compose exec -T api sh -lc 'CMS_ADMIN_EMAIL=""$CMS_ADMIN_EMAIL"" CMS_ADMIN_PASSWORD=""$CMS_ADMIN_PASSWORD"" SWEEP_BASE_URL=""$SWEEP_BASE_URL"" node --input-type=module -' < scripts/prod_authenticated_endpoint_sweep.mjs
else
  SWEEP_BASE_URL='http://127.0.0.1:8080' docker compose exec -T api sh -lc 'SWEEP_BASE_URL=""$SWEEP_BASE_URL"" node --input-type=module -' < scripts/prod_authenticated_endpoint_sweep.mjs
fi
"@

Write-Host "==> Running authenticated endpoint regression sweep on $VmAlias..."
ssh $VmAlias $remoteCommand
