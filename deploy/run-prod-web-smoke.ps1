param(
  [string]$BaseUrl = "https://meritlaunchers.com"
)

$ErrorActionPreference = "Stop"

function Assert-HttpOk {
  param(
    [string]$Path,
    [string]$Contains = ""
  )

  $uri = "$BaseUrl$Path"
  $response = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 30
  if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
    throw "$uri returned HTTP $($response.StatusCode)"
  }
  if ($Contains -and -not $response.Content.Contains($Contains)) {
    throw "$uri did not contain expected marker: $Contains"
  }
  return $response
}

Write-Host "==> Running production web smoke test against $BaseUrl..."

Assert-HttpOk -Path "/" -Contains "Merit Launchers" | Out-Null
Assert-HttpOk -Path "/faq" | Out-Null
Assert-HttpOk -Path "/contact" | Out-Null
Assert-HttpOk -Path "/admin/" -Contains '<base href="/admin/">' | Out-Null
Assert-HttpOk -Path "/portal/" -Contains '<base href="/portal/">' | Out-Null

$adminBootstrap = Assert-HttpOk -Path "/admin/flutter_bootstrap.js"
if (-not $adminBootstrap.Content.Contains("serviceWorkerSettings: null")) {
  throw "Admin bootstrap still contains serviceWorkerSettings. Service worker cache must stay disabled for deterministic deploys."
}

$portalBootstrap = Assert-HttpOk -Path "/portal/flutter_bootstrap.js"
if (-not $portalBootstrap.Content.Contains("serviceWorkerSettings: null")) {
  throw "Portal bootstrap still contains serviceWorkerSettings. Service worker cache must stay disabled for deterministic deploys."
}

$bootstrap = Invoke-WebRequest -Uri "$BaseUrl/api/v1/bootstrap" -UseBasicParsing -TimeoutSec 30
if ($bootstrap.StatusCode -ne 200) {
  throw "/api/v1/bootstrap returned HTTP $($bootstrap.StatusCode)"
}
$json = $bootstrap.Content | ConvertFrom-Json
if (-not $json.courses -or $json.courses.Count -lt 1) {
  throw "/api/v1/bootstrap did not return courses."
}

Write-Host "==> Production web smoke passed."
