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

& $flutter build web --dart-define=APP_ENV=prod --base-href /portal/
New-Item -ItemType Directory -Force -Path $portalTarget | Out-Null
Get-ChildItem -Path $buildDir -Force | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $portalTarget -Recurse -Force
}

Remove-Item -Recurse -Force $buildDir

& $flutter build web --dart-define=APP_ENV=prod --base-href /admin/
New-Item -ItemType Directory -Force -Path $adminTarget | Out-Null
Get-ChildItem -Path $buildDir -Force | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $adminTarget -Recurse -Force
}

Remove-Item -Recurse -Force $buildDir

& $flutter build web --dart-define=APP_ENV=prod --base-href /marketing/
New-Item -ItemType Directory -Force -Path $marketingTarget | Out-Null
Get-ChildItem -Path $buildDir -Force | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $marketingTarget -Recurse -Force
}

Write-Host "Marketing site, student portal, admin portal, and marketing console copied to $targetDir"
