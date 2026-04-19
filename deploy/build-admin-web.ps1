$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$flutter = 'C:\Users\VRISHANK\tools\flutter\bin\flutter.bat'
$buildDir = Join-Path $repoRoot 'build\web'
$targetDir = Join-Path $repoRoot 'deploy\admin-web'
$marketingDir = Join-Path $repoRoot 'marketing'
$marketingSource = Join-Path $repoRoot 'deploy\marketing-site'
$portalTarget = Join-Path $targetDir 'portal'
$adminTarget = Join-Path $targetDir 'admin'
$marketingTarget = Join-Path $targetDir 'marketing'

if ($env:MERIT_QA_ALREADY_RAN -ne '1') {
  powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'run-qa.ps1')
}

function Disable-ServiceWorkerBootstrap {
  param(
    [string]$AppDir
  )

  $bootstrapPath = Join-Path $AppDir 'flutter_bootstrap.js'
  if (-not (Test-Path $bootstrapPath)) {
    return
  }

  $content = Get-Content $bootstrapPath -Raw
  $updated = $content -replace 'serviceWorkerSettings:\s*\{\s*serviceWorkerVersion:\s*"[^"]+"\s*\}', 'serviceWorkerSettings: null'
  Set-Content -Path $bootstrapPath -Value $updated -NoNewline
}

function Install-ServiceWorkerKillSwitch {
  param(
    [string]$AppDir
  )

  $serviceWorkerPath = Join-Path $AppDir 'flutter_service_worker.js'
  $killSwitch = @'
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    if (self.caches && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map(function (key) { return caches.delete(key); }));
    }
    if (self.registration && self.registration.unregister) {
      await self.registration.unregister();
    }
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.navigate(client.url);
    }
  })());
});

self.addEventListener('fetch', function () {
  return;
});
'@
  Set-Content -Path $serviceWorkerPath -Value $killSwitch -NoNewline
}

# Build React marketing site → deploy/marketing-site/
Write-Host "==> Building React marketing site..."
Push-Location $marketingDir
npm install --silent
npm run build
Pop-Location

if (Test-Path $marketingSource) {
  Remove-Item -Recurse -Force $marketingSource
}
New-Item -ItemType Directory -Force -Path $marketingSource | Out-Null
Get-ChildItem -Path (Join-Path $marketingDir 'dist') -Force | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $marketingSource -Recurse -Force
}

if (Test-Path $targetDir) {
  Remove-Item -Recurse -Force $targetDir
}
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Get-ChildItem -Path $marketingSource -Force | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $targetDir -Recurse -Force
}

if (Test-Path $buildDir) {
  Remove-Item -Recurse -Force $buildDir
}

Push-Location $repoRoot
& $flutter build web --dart-define=APP_ENV=prod --base-href /portal/
New-Item -ItemType Directory -Force -Path $portalTarget | Out-Null
Get-ChildItem -Path $buildDir -Force | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $portalTarget -Recurse -Force
}
Disable-ServiceWorkerBootstrap -AppDir $portalTarget
Install-ServiceWorkerKillSwitch -AppDir $portalTarget

Remove-Item -Recurse -Force $buildDir

& $flutter build web --dart-define=APP_ENV=prod --base-href /admin/
New-Item -ItemType Directory -Force -Path $adminTarget | Out-Null
Get-ChildItem -Path $buildDir -Force | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $adminTarget -Recurse -Force
}
Disable-ServiceWorkerBootstrap -AppDir $adminTarget
Install-ServiceWorkerKillSwitch -AppDir $adminTarget

Remove-Item -Recurse -Force $buildDir

& $flutter build web --dart-define=APP_ENV=prod --base-href /marketing/
New-Item -ItemType Directory -Force -Path $marketingTarget | Out-Null
Get-ChildItem -Path $buildDir -Force | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $marketingTarget -Recurse -Force
}
Disable-ServiceWorkerBootstrap -AppDir $marketingTarget
Install-ServiceWorkerKillSwitch -AppDir $marketingTarget
Pop-Location

Write-Host "Marketing site, student portal, admin portal, and marketing console copied to $targetDir"
