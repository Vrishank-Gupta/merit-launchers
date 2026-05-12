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

$adminEmail = $env:MERIT_QA_ADMIN_EMAIL
$adminPassword = $env:MERIT_QA_ADMIN_PASSWORD
$studentEmail = $env:MERIT_QA_STUDENT_EMAIL
$studentPassword = $env:MERIT_QA_STUDENT_PASSWORD
$marketingAdminEmail = if ($env:MERIT_QA_MARKETING_ADMIN_EMAIL) { $env:MERIT_QA_MARKETING_ADMIN_EMAIL } else { "marketing@meritlaunchers.com" }
$marketingAdminPassword = if ($env:MERIT_QA_MARKETING_ADMIN_PASSWORD) { $env:MERIT_QA_MARKETING_ADMIN_PASSWORD } else { "marketing123" }
$partnerEmail = $env:MERIT_QA_PARTNER_EMAIL
$partnerPassword = $env:MERIT_QA_PARTNER_PASSWORD

if (-not $adminEmail -or -not $adminPassword -or -not $studentEmail -or -not $studentPassword) {
  Write-Host "==> Live auth smoke skipped. Set MERIT_QA_ADMIN_EMAIL, MERIT_QA_ADMIN_PASSWORD, MERIT_QA_STUDENT_EMAIL, MERIT_QA_STUDENT_PASSWORD to enable."
  return
}

Write-Host "==> Running production password-login smoke against $BaseUrl..."

$adminLogin = Invoke-Json -Path "/api/v1/auth/password-login" -Method "POST" -Body @{
  email = $adminEmail
  password = $adminPassword
}
if ($adminLogin.user.role -ne "admin" -or -not $adminLogin.token) {
  throw "Admin password login smoke failed."
}

$adminBootstrap = Invoke-Json -Path "/api/v1/bootstrap" -Token $adminLogin.token
if (-not $adminBootstrap.courses -or $adminBootstrap.courses.Count -lt 1) {
  throw "Admin-authenticated bootstrap did not return courses."
}

$studentLogin = Invoke-Json -Path "/api/v1/auth/password-login" -Method "POST" -Body @{
  email = $studentEmail
  password = $studentPassword
  platform = "web"
}
if ($studentLogin.user.role -ne "student" -or -not $studentLogin.token) {
  throw "Student password login smoke failed."
}

$studentBootstrap = Invoke-Json -Path "/api/v1/bootstrap" -Token $studentLogin.token
if (-not $studentBootstrap.currentStudent -or -not $studentBootstrap.courses) {
  throw "Student-authenticated bootstrap did not return workspace data."
}

$marketingAdminLogin = Invoke-Json -Path "/api/v1/marketing-admin/auth/login" -Method "POST" -Body @{
  email = $marketingAdminEmail
  password = $marketingAdminPassword
}
if (-not $marketingAdminLogin.token) {
  throw "Marketing admin password login smoke failed."
}

$marketingAdminMe = Invoke-Json -Path "/api/v1/marketing-admin/me" -Token $marketingAdminLogin.token
if (-not $marketingAdminMe.admin.email) {
  throw "Marketing admin authenticated profile smoke failed."
}

if ($partnerEmail -and $partnerPassword) {
  $partnerLogin = Invoke-Json -Path "/api/v1/partner/auth/login" -Method "POST" -Body @{
    email = $partnerEmail
    password = $partnerPassword
  }
  if (-not $partnerLogin.token) {
    throw "Partner password login smoke failed."
  }

  $partnerMe = Invoke-Json -Path "/api/v1/partner/me" -Token $partnerLogin.token
  if (-not $partnerMe.id -or -not $partnerMe.login_email) {
    throw "Partner authenticated profile smoke failed."
  }
} else {
  Write-Host "==> Partner auth smoke skipped. Set MERIT_QA_PARTNER_EMAIL and MERIT_QA_PARTNER_PASSWORD to enable."
}

Write-Host "==> Production auth smoke passed."
