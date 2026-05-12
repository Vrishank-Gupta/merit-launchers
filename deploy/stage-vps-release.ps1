param(
  [switch]$Runtime,
  [switch]$Web,
  [switch]$MarketingSite,
  [switch]$BuildApi,
  [string]$ReleaseId = "",
  [string]$ScheduleAt = "",
  [string]$VmAlias = "myvps",
  [string]$VmDir = "/root/merit-launchers"
)

$ErrorActionPreference = "Stop"

if (-not $Runtime -and -not $Web -and -not $MarketingSite) {
  throw "Select at least one of -Runtime, -Web, or -MarketingSite."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($ReleaseId)) {
  $ReleaseId = "release-" + (Get-Date -Format "yyyyMMdd-HHmmss")
}

$stageRoot = Join-Path $repoRoot ".deploy-staging\$ReleaseId"
if (Test-Path $stageRoot) {
  Remove-Item -Recurse -Force $stageRoot
}
New-Item -ItemType Directory -Force -Path $stageRoot | Out-Null

$components = @()
$restartApi = $false
$restartNginx = $false

Write-Host "==> Running mandatory QA before staging..."
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'run-local-regression.ps1')
$env:MERIT_QA_ALREADY_RAN = '1'

if ($MarketingSite) {
  Write-Host "==> Building marketing site locally..."
  Push-Location (Join-Path $repoRoot 'marketing')
  npm install --silent
  npm run build
  Pop-Location

  $target = Join-Path $stageRoot 'marketing-site-root'
  New-Item -ItemType Directory -Force -Path $target | Out-Null
  Get-ChildItem -Path (Join-Path $repoRoot 'marketing\dist') -Force | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $target -Recurse -Force
  }
  $components += 'marketing_site_root'
  $restartNginx = $true
}

if ($Web) {
  Write-Host "==> Building full web bundle locally..."
  powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'build-admin-web.ps1')

  $target = Join-Path $stageRoot 'admin-web'
  New-Item -ItemType Directory -Force -Path $target | Out-Null
  Get-ChildItem -Path (Join-Path $repoRoot 'deploy\admin-web') -Force | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $target -Recurse -Force
  }
  $components += 'web_bundle'
  $restartNginx = $true
}

if ($Runtime) {
  Write-Host "==> Staging runtime/api files..."
  $runtimeRoot = Join-Path $stageRoot 'runtime'
  New-Item -ItemType Directory -Force -Path (Join-Path $runtimeRoot 'server\src') | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $runtimeRoot 'server\sql') | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $runtimeRoot 'scripts') | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $runtimeRoot 'deploy\nginx') | Out-Null

  Copy-Item -Path (Join-Path $repoRoot 'docker-compose.yml') -Destination (Join-Path $runtimeRoot 'docker-compose.yml') -Force
  Copy-Item -Path (Join-Path $repoRoot 'server\Dockerfile') -Destination (Join-Path $runtimeRoot 'server\Dockerfile') -Force
  Copy-Item -Path (Join-Path $repoRoot 'server\package.json') -Destination (Join-Path $runtimeRoot 'server\package.json') -Force
  Copy-Item -Path (Join-Path $repoRoot 'server\package-lock.json') -Destination (Join-Path $runtimeRoot 'server\package-lock.json') -Force
  Copy-Item -Path (Join-Path $repoRoot 'server\src\*') -Destination (Join-Path $runtimeRoot 'server\src') -Recurse -Force
  Copy-Item -Path (Join-Path $repoRoot 'server\sql\*') -Destination (Join-Path $runtimeRoot 'server\sql') -Recurse -Force
  Copy-Item -Path (Join-Path $repoRoot 'scripts\prod_authenticated_endpoint_sweep.mjs') -Destination (Join-Path $runtimeRoot 'scripts\prod_authenticated_endpoint_sweep.mjs') -Force
  Copy-Item -Path (Join-Path $repoRoot 'deploy\nginx\default.conf') -Destination (Join-Path $runtimeRoot 'deploy\nginx\default.conf') -Force

  $components += 'runtime'
  $restartApi = $true
  $restartNginx = $true
}

$manifest = @{
  releaseId = $ReleaseId
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
  components = $components
  buildApi = [bool]$BuildApi
  restartApi = [bool]$restartApi
  restartNginx = [bool]$restartNginx
}
$manifest | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $stageRoot 'manifest.json')

$tarPath = Join-Path $repoRoot "deploy\$ReleaseId.tar.gz"
if (Test-Path $tarPath) {
  Remove-Item -Force $tarPath
}

Write-Host "==> Packaging release tarball..."
tar -czf $tarPath -C $stageRoot .

Write-Host "==> Uploading release tarball and VPS deploy scripts..."
ssh $VmAlias "mkdir -p $VmDir/deploy/vps-releases/incoming"
scp $tarPath "${VmAlias}:$VmDir/deploy/vps-releases/incoming/$ReleaseId.tar.gz"
scp (Join-Path $repoRoot 'deploy\vps-run-smoke.sh') "${VmAlias}:$VmDir/deploy/vps-run-smoke.sh"
scp (Join-Path $repoRoot 'deploy\vps-deploy-release.sh') "${VmAlias}:$VmDir/deploy/vps-deploy-release.sh"
ssh $VmAlias "chmod 755 $VmDir/deploy/vps-run-smoke.sh $VmDir/deploy/vps-deploy-release.sh"

if (-not [string]::IsNullOrWhiteSpace($ScheduleAt)) {
  $targetLocal = [DateTimeOffset]::Parse($ScheduleAt)
  $targetUtc = $targetLocal.ToUniversalTime()
  $cronMinute = $targetUtc.Minute
  $cronHour = $targetUtc.Hour
  $cronDay = $targetUtc.Day
  $cronMonth = $targetUtc.Month
  $cronLogPath = "$VmDir/deploy/vps-releases/logs/$ReleaseId.cron.log"
  $cronLine = "$cronMinute $cronHour $cronDay $cronMonth * $VmDir/deploy/vps-deploy-release.sh --release-id $ReleaseId >> $cronLogPath 2>&1"
  Write-Host "==> Scheduling VPS deployment at $ScheduleAt ($($targetUtc.ToString('yyyy-MM-dd HH:mm:ss')) UTC on VPS)..."
  ssh $VmAlias "(crontab -l 2>/dev/null | grep -v '$ReleaseId'; echo '$cronLine') | crontab -"
}

Write-Host "==> Release staged successfully."
Write-Host "Release ID: $ReleaseId"
Write-Host "Tarball: $tarPath"
