$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host '==> Running Flutter regression gate...'
powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'run-qa.ps1')
$env:MERIT_QA_ALREADY_RAN = '1'

Write-Host '==> Running Node API syntax gate...'
Push-Location $repoRoot
try {
  node --check server/src/index.js
  if ($LASTEXITCODE -ne 0) {
    throw "Node syntax check failed with exit code $LASTEXITCODE."
  }

  node --check scripts/prod_authenticated_endpoint_sweep.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "Authenticated endpoint sweep syntax check failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

Write-Host '==> Running marketing frontend production build gate...'
Push-Location (Join-Path $repoRoot 'marketing')
try {
  npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "Marketing build failed with exit code $LASTEXITCODE."
  }

  if ($env:MERIT_STRICT_MARKETING_LINT -eq '1') {
    Write-Host '==> Running strict marketing lint gate...'
    npm run lint
    if ($LASTEXITCODE -ne 0) {
      throw "Marketing lint failed with exit code $LASTEXITCODE."
    }
  } else {
    Write-Host '==> Marketing lint is currently non-blocking. Set MERIT_STRICT_MARKETING_LINT=1 to enforce it.'
  }
} finally {
  Pop-Location
}

Write-Host '==> Local regression suite passed.'
