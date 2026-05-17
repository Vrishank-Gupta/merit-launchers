$ErrorActionPreference = 'Stop'

$keyPath = Join-Path $HOME '.ssh\merit_launchers_actions'
$privateKeyPath = $keyPath
$publicKeyPath = "$keyPath.pub"
$knownHostsPath = Join-Path $HOME '.ssh\known_hosts'
$hostLine = '87.232.72.72 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIM0afpRfrVNtFcejch/bO7vdxkWXUQdonQaOFmGHTzfR'

if (-not (Test-Path $privateKeyPath)) {
  throw "Missing private key at $privateKeyPath"
}

Write-Host 'GitHub repository secrets to add:'
Write-Host ''
Write-Host 'PROD_SSH_TARGET'
Write-Host 'root@87.232.72.72'
Write-Host ''
Write-Host 'PROD_SSH_KNOWN_HOSTS'
Write-Host $hostLine
Write-Host ''
Write-Host 'PROD_SSH_PRIVATE_KEY'
Get-Content $privateKeyPath
Write-Host ''
Write-Host 'Installed public key on VPS:'
Get-Content $publicKeyPath
