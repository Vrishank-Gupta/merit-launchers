param(
  [string]$BaseUrl = "https://meritlaunchers.com"
)

$ErrorActionPreference = "Stop"

function Invoke-Json {
  param(
    [string]$Path,
    [string]$Method = "GET",
    [object]$Body = $null,
    [string]$Token = ""
  )

  $headers = @{ Accept = "application/json" }
  if ($Token) {
    $headers["Authorization"] = "Bearer $Token"
  }

  $params = @{
    Uri = "$BaseUrl$Path"
    Method = $Method
    Headers = $headers
    UseBasicParsing = $true
    TimeoutSec = 30
  }
  if ($null -ne $Body) {
    $headers["Content-Type"] = "application/json"
    $params["Body"] = ($Body | ConvertTo-Json -Depth 30)
  }

  $response = Invoke-WebRequest @params
  if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
    throw "$Path returned HTTP $($response.StatusCode)"
  }
  return $response.Content | ConvertFrom-Json
}

function Assert-HttpOk {
  param(
    [string]$Path
  )

  $response = Invoke-WebRequest -Uri "$BaseUrl$Path" -UseBasicParsing -TimeoutSec 30
  if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
    throw "$Path returned HTTP $($response.StatusCode)"
  }
}

Write-Host "==> Running marketing-admin/partner portal smoke against $BaseUrl..."

Assert-HttpOk -Path "/partner/login"
Assert-HttpOk -Path "/marketing-admin/login"
Assert-HttpOk -Path "/join/ADMIN"

$marketingAdminEmail = if ($env:MERIT_QA_MARKETING_ADMIN_EMAIL) { $env:MERIT_QA_MARKETING_ADMIN_EMAIL } else { "marketing@meritlaunchers.com" }
$marketingAdminPassword = if ($env:MERIT_QA_MARKETING_ADMIN_PASSWORD) { $env:MERIT_QA_MARKETING_ADMIN_PASSWORD } else { "marketing123" }

$marketingAdminLogin = Invoke-Json -Path "/api/v1/marketing-admin/auth/login" -Method "POST" -Body @{
  email = $marketingAdminEmail
  password = $marketingAdminPassword
}
if (-not $marketingAdminLogin.token) {
  throw "Marketing admin login smoke failed."
}

$marketingAdminMe = Invoke-Json -Path "/api/v1/marketing-admin/me" -Token $marketingAdminLogin.token
if (-not $marketingAdminMe.admin.email) {
  throw "Marketing admin profile smoke failed."
}

$marketingPending = Invoke-Json -Path "/api/v1/marketing-admin/pending" -Token $marketingAdminLogin.token
if ($null -eq $marketingPending.pending) {
  throw "Marketing admin pending queue smoke failed."
}

$marketingNetwork = Invoke-Json -Path "/api/v1/marketing-admin/network" -Token $marketingAdminLogin.token
if ($null -eq $marketingNetwork.tree) {
  throw "Marketing admin network smoke failed."
}

$partnerEmail = $env:MERIT_QA_PARTNER_EMAIL
$partnerPassword = $env:MERIT_QA_PARTNER_PASSWORD
if (-not $partnerEmail -or -not $partnerPassword) {
  Write-Host "==> Partner authenticated smoke skipped. Set MERIT_QA_PARTNER_EMAIL and MERIT_QA_PARTNER_PASSWORD to enable."
  Write-Host "==> Portal smoke passed for public routes and marketing admin APIs."
  return
}

$partnerLogin = Invoke-Json -Path "/api/v1/partner/auth/login" -Method "POST" -Body @{
  email = $partnerEmail
  password = $partnerPassword
}
if (-not $partnerLogin.token) {
  throw "Partner login smoke failed."
}

$partnerMe = Invoke-Json -Path "/api/v1/partner/me" -Token $partnerLogin.token
if (-not $partnerMe.id -or -not $partnerMe.login_email) {
  throw "Partner profile smoke failed."
}
if (-not $partnerMe.bank_ifsc_code -or -not $partnerMe.bank_account_number -or -not $partnerMe.aadhaar_number) {
  throw "Partner KYC/bank detail smoke failed."
}

$partnerStats = Invoke-Json -Path "/api/v1/partner/stats" -Token $partnerLogin.token
if ($null -eq $partnerStats.hierarchySummary) {
  throw "Partner stats smoke failed."
}

$partnerNetwork = Invoke-Json -Path "/api/v1/partner/network" -Token $partnerLogin.token
if ($null -eq $partnerNetwork.subPartners -or $null -eq $partnerNetwork.networkSummary) {
  throw "Partner network smoke failed."
}

if ($partnerNetwork.subPartners.Count -gt 0) {
  $firstPartner = $partnerNetwork.subPartners[0]
  $subDetail = Invoke-Json -Path "/api/v1/partner/sub-partners/$($firstPartner.id)" -Token $partnerLogin.token
  if (-not $subDetail.partner.id) {
    throw "Partner sub-partner detail smoke failed."
  }
}

Write-Host "==> Portal smoke passed."
