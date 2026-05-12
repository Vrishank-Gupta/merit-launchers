param(
  [switch]$IncludeProduction,
  [string]$VmAlias = "myvps",
  [string]$VmDir = "/root/merit-launchers",
  [string]$BaseUrl = "https://meritlaunchers.com"
)

$ErrorActionPreference = "Stop"

Write-Host "==> Running full local regression suite..."
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'run-local-regression.ps1')

if (-not $IncludeProduction) {
  Write-Host "==> Full regression suite passed (local only)."
  return
}

Write-Host "==> Running production API regression smoke..."
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'run-prod-smoke.ps1') -VmAlias $VmAlias -VmDir $VmDir

Write-Host "==> Running production auth regression smoke..."
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'run-prod-auth-smoke.ps1') -BaseUrl $BaseUrl

Write-Host "==> Running production web regression smoke..."
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'run-prod-web-smoke.ps1') -BaseUrl $BaseUrl

Write-Host "==> Running production browser regression smoke..."
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'run-prod-browser-smoke.ps1') -BaseUrl $BaseUrl

Write-Host "==> Running production portal regression smoke..."
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'run-prod-portal-smoke.ps1') -BaseUrl $BaseUrl

Write-Host "==> Running production authenticated endpoint regression sweep..."
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'run-prod-endpoint-regression.ps1') -VmAlias $VmAlias -VmDir $VmDir

Write-Host "==> Full regression suite passed."
