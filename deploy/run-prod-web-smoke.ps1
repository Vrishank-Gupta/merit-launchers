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

function Assert-HeaderContains {
  param(
    $Response,
    [string]$Header,
    [string]$Contains
  )

  $value = $Response.Headers[$Header]
  if (-not $value -or -not ($value -join ' ').Contains($Contains)) {
    throw "Expected header $Header to contain '$Contains'."
  }
}

Write-Host "==> Running production web smoke test against $BaseUrl..."

Assert-HttpOk -Path "/" -Contains "Merit Launchers" | Out-Null
Assert-HttpOk -Path "/faq" | Out-Null
Assert-HttpOk -Path "/contact" | Out-Null
Assert-HttpOk -Path "/partner/login" | Out-Null
Assert-HttpOk -Path "/marketing-admin/login" | Out-Null
Assert-HttpOk -Path "/join/ADMIN" | Out-Null
$adminIndex = Assert-HttpOk -Path "/admin/" -Contains '<base href="/admin/">'
$portalIndex = Assert-HttpOk -Path "/portal/" -Contains '<base href="/portal/">'
$marketingIndex = Assert-HttpOk -Path "/marketing/" -Contains '<base href="/marketing/">'

Assert-HeaderContains -Response $adminIndex -Header "Cache-Control" -Contains "no-cache"
Assert-HeaderContains -Response $portalIndex -Header "Cache-Control" -Contains "no-cache"
Assert-HeaderContains -Response $marketingIndex -Header "Cache-Control" -Contains "no-cache"

$adminBootstrap = Assert-HttpOk -Path "/admin/flutter_bootstrap.js"
if (-not $adminBootstrap.Content.Contains("serviceWorkerSettings: null")) {
  throw "Admin bootstrap still contains serviceWorkerSettings. Service worker cache must stay disabled for deterministic deploys."
}
Assert-HeaderContains -Response $adminBootstrap -Header "Cache-Control" -Contains "no-cache"

$portalBootstrap = Assert-HttpOk -Path "/portal/flutter_bootstrap.js"
if (-not $portalBootstrap.Content.Contains("serviceWorkerSettings: null")) {
  throw "Portal bootstrap still contains serviceWorkerSettings. Service worker cache must stay disabled for deterministic deploys."
}
Assert-HeaderContains -Response $portalBootstrap -Header "Cache-Control" -Contains "no-cache"

$marketingBootstrap = Assert-HttpOk -Path "/marketing/flutter_bootstrap.js"
if (-not $marketingBootstrap.Content.Contains("serviceWorkerSettings: null")) {
  throw "Marketing bootstrap still contains serviceWorkerSettings. Service worker cache must stay disabled for deterministic deploys."
}
Assert-HeaderContains -Response $marketingBootstrap -Header "Cache-Control" -Contains "no-cache"

$adminMainJs = Assert-HttpOk -Path "/admin/main.dart.js"
$portalMainJs = Assert-HttpOk -Path "/portal/main.dart.js"
$marketingMainJs = Assert-HttpOk -Path "/marketing/main.dart.js"

Assert-HeaderContains -Response $adminMainJs -Header "Cache-Control" -Contains "no-cache"
Assert-HeaderContains -Response $portalMainJs -Header "Cache-Control" -Contains "no-cache"
Assert-HeaderContains -Response $marketingMainJs -Header "Cache-Control" -Contains "no-cache"

$adminServiceWorker = Assert-HttpOk -Path "/admin/flutter_service_worker.js"
$portalServiceWorker = Assert-HttpOk -Path "/portal/flutter_service_worker.js"
$marketingServiceWorker = Assert-HttpOk -Path "/marketing/flutter_service_worker.js"

foreach ($serviceWorker in @($adminServiceWorker, $portalServiceWorker, $marketingServiceWorker)) {
  if (-not $serviceWorker.Content.Contains("self.skipWaiting()") -or -not $serviceWorker.Content.Contains("self.registration.unregister")) {
    throw "Flutter service worker kill switch is missing from one of the deployed surfaces."
  }
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
