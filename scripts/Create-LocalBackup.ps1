param(
  [Parameter(Mandatory = $true)]
  [string]$BackupRoot,

  [switch]$IncludeGitHistory
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$TargetRoot = Join-Path $BackupRoot "backup-$Timestamp"

$CodeTarget = Join-Path $TargetRoot "code"
$SecretsTarget = Join-Path $TargetRoot "secrets"
$ProductionTarget = Join-Path $TargetRoot "production"
$AssetsTarget = Join-Path $TargetRoot "assets"
$NotesTarget = Join-Path $TargetRoot "notes"

New-Item -ItemType Directory -Force -Path $CodeTarget, $SecretsTarget, $ProductionTarget, $AssetsTarget, $NotesTarget | Out-Null

$RepoCopyTarget = Join-Path $CodeTarget "merit_launchers"

$excludeDirs = @(
  ".dart_tool",
  "build",
  "tmp",
  "node_modules",
  "server\node_modules",
  "android\.gradle",
  "deploy\admin-web",
  ".git"
)

if ($IncludeGitHistory) {
  $excludeDirs = $excludeDirs | Where-Object { $_ -ne ".git" }
}

$robocopyArgs = @(
  $RepoRoot,
  $RepoCopyTarget,
  "/MIR",
  "/R:1",
  "/W:1",
  "/NFL",
  "/NDL",
  "/NJH",
  "/NJS",
  "/NP"
)

if ($excludeDirs.Count -gt 0) {
  $robocopyArgs += "/XD"
  $robocopyArgs += $excludeDirs
}

& robocopy @robocopyArgs | Out-Null
$robocopyExit = $LASTEXITCODE
if ($robocopyExit -gt 7) {
  throw "robocopy failed with exit code $robocopyExit"
}

$secretFiles = @(
  "server.env",
  ".env.prod",
  ".env.dev",
  "marketing\.env",
  "marketing\.env.local",
  "android\key.properties",
  "android\merit-launchers-upload.jks"
)

foreach ($relativePath in $secretFiles) {
  $source = Join-Path $RepoRoot $relativePath
  if (Test-Path $source) {
    $dest = Join-Path $SecretsTarget $relativePath
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
    Copy-Item $source $dest -Force
  }
}

$prodFiles = @(
  "docker-compose.yml",
  "deploy\nginx\default.conf",
  "deploy\build-admin-web.ps1",
  "deploy.ps1",
  "docker\backup-postgres.sh",
  "README.md"
)

foreach ($relativePath in $prodFiles) {
  $source = Join-Path $RepoRoot $relativePath
  if (Test-Path $source) {
    $dest = Join-Path $ProductionTarget $relativePath
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
    Copy-Item $source $dest -Force
  }
}

$assetDirs = @(
  "server\blog-images",
  "server\toolkit-files",
  "assets",
  "play_store_release"
)

foreach ($relativeDir in $assetDirs) {
  $source = Join-Path $RepoRoot $relativeDir
  if (Test-Path $source) {
    $dest = Join-Path $AssetsTarget $relativeDir
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
    Copy-Item $source $dest -Recurse -Force
  }
}

$notes = @"
Backup created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
Repo root: $RepoRoot
Included git history: $($IncludeGitHistory.IsPresent)

Code backup:
- $RepoCopyTarget

Secrets backup:
- server.env
- .env.prod
- .env.dev
- marketing/.env
- marketing/.env.local
- android/key.properties
- android/merit-launchers-upload.jks

Production config backup:
- docker-compose.yml
- deploy/nginx/default.conf
- deploy/build-admin-web.ps1
- deploy.ps1
- docker/backup-postgres.sh
- README.md

Assets backup:
- server/blog-images
- server/toolkit-files
- assets
- play_store_release

Important:
- Encrypt the 'secrets' folder after copying this backup to the external drive.
- This local backup does NOT contain a live production database dump.
- Run Create-ProductionBackup.ps1 separately for VPS state.
"@

$notesPath = Join-Path $NotesTarget "BACKUP_SUMMARY.txt"
$notes | Set-Content -Path $notesPath -Encoding UTF8

Write-Host "Backup created at: $TargetRoot"
Write-Host "Encrypt this folder's 'secrets' subfolder before long-term storage."
