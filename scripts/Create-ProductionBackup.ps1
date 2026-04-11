param(
  [Parameter(Mandatory = $true)]
  [string]$BackupRoot,

  [string]$SshTarget = "myvps",

  [string]$RemoteAppRoot = "/root/merit-launchers"
)

$ErrorActionPreference = "Stop"

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LocalTarget = Join-Path $BackupRoot "prod-backup-$Timestamp"
New-Item -ItemType Directory -Force -Path $LocalTarget | Out-Null

$RemoteTmp = "/tmp/merit-launchers-backup-$Timestamp"

$remoteScript = @'
set -eu
mkdir -p '__REMOTE_TMP__'
cd '__REMOTE_APP_ROOT__'

DB_NAME=$(grep '^POSTGRES_DB=' server.env | cut -d= -f2-)
DB_USER=$(grep '^POSTGRES_USER=' server.env | cut -d= -f2-)

docker exec merit-launchers-postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > '__REMOTE_TMP__/postgres.sql.gz'

tar -czf '__REMOTE_TMP__/app-state.tgz' \
  docker-compose.yml \
  server.env \
  deploy/nginx/default.conf \
  deploy/admin-web \
  server/blog-images \
  server/toolkit-files \
  docker/backups

tar -czf '__REMOTE_TMP__/letsencrypt.tgz' /etc/letsencrypt

{
  echo "Backup timestamp: $(date)"
  echo "Hostname: $(hostname)"
  echo "Remote app root: __REMOTE_APP_ROOT__"
  echo
  echo "Docker containers:"
  docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
  echo
  echo "Docker compose services:"
  docker compose ps
} > '__REMOTE_TMP__/system-info.txt'
'@

$remoteScript = $remoteScript.Replace('__REMOTE_TMP__', $RemoteTmp).Replace('__REMOTE_APP_ROOT__', $RemoteAppRoot)

ssh $SshTarget $remoteScript

scp "$SshTarget`:$RemoteTmp/postgres.sql.gz" "$LocalTarget/postgres.sql.gz" | Out-Null
scp "$SshTarget`:$RemoteTmp/app-state.tgz" "$LocalTarget/app-state.tgz" | Out-Null
scp "$SshTarget`:$RemoteTmp/letsencrypt.tgz" "$LocalTarget/letsencrypt.tgz" | Out-Null
scp "$SshTarget`:$RemoteTmp/system-info.txt" "$LocalTarget/system-info.txt" | Out-Null

ssh $SshTarget "rm -rf '$RemoteTmp'"

$notes = @"
Production backup created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
SSH target: $SshTarget
Remote app root: $RemoteAppRoot

Files:
- postgres.sql.gz
- app-state.tgz
- letsencrypt.tgz
- system-info.txt

Restore outline:
1. Provision new Ubuntu VPS
2. Install Docker + Docker Compose
3. Restore app-state.tgz under the chosen app root
4. Restore /etc/letsencrypt from letsencrypt.tgz
5. Start postgres first
6. Restore postgres.sql.gz into the postgres container
7. Start api + nginx
"@

$notes | Set-Content -Path (Join-Path $LocalTarget "README.txt") -Encoding UTF8

Write-Host "Production backup created at: $LocalTarget"
Write-Host "This backup contains the live DB dump, deployed bundle, runtime config, and SSL material."
