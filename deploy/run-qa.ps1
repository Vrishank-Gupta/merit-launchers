$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$flutter = 'C:\Users\VRISHANK\tools\flutter\bin\flutter.bat'

if ($env:MERIT_SKIP_QA -eq '1') {
  Write-Host '==> QA skipped because MERIT_SKIP_QA=1'
  return
}

Push-Location $repoRoot
try {
  Write-Host '==> Running mandatory Flutter test suite...'
  & $flutter test
  if ($LASTEXITCODE -ne 0) {
    throw "Flutter tests failed with exit code $LASTEXITCODE."
  }

  Write-Host '==> Running focused parser/rendering analyzer check...'
  dart analyze `
    lib\app\app_controller.dart `
    lib\app\api_client.dart `
    lib\app\data\api_app_repository.dart `
    lib\app\models.dart `
    lib\features\admin\clipboard_image_stub.dart `
    lib\features\admin\clipboard_image_web.dart `
    lib\math\math_content.dart `
    lib\widgets\math_text.dart `
    lib\widgets\rich_math_content.dart `
    test\api_client_test.dart `
    test\api_repository_contract_test.dart `
    test\auth_entry_widget_test.dart `
    test\math_formatter_test.dart `
    test\math_content_parser_test.dart `
    test\portal_workflow_test.dart
  if ($LASTEXITCODE -ne 0) {
    throw "Focused analyzer check failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
