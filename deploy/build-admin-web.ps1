$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$flutter = 'C:\Users\VRISHANK\tools\flutter\bin\flutter.bat'
$buildDir = Join-Path $repoRoot 'build\web'
$targetDir = Join-Path $repoRoot 'deploy\admin-web'

& $flutter build web --dart-define=APP_ENV=dev

if (Test-Path $targetDir) {
  Remove-Item -Recurse -Force $targetDir
}

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item -Path (Join-Path $buildDir '*') -Destination $targetDir -Recurse -Force

Write-Host "Admin web build copied to $targetDir"
