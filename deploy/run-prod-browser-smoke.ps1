param(
  [string]$BaseUrl = "https://meritlaunchers.com"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runnerDir = Join-Path $repoRoot 'tools\playwright-runner'

Write-Host "==> Running production browser smoke against $BaseUrl..."

Push-Location $runnerDir
try {
  $env:MERIT_BASE_URL = $BaseUrl
  node .\prod_site_smoke.js
  if ($LASTEXITCODE -ne 0) {
    throw "Production browser smoke failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

Write-Host "==> Production browser smoke passed."
