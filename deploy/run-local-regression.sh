#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${MERIT_SKIP_QA:-0}" == "1" ]]; then
  echo "==> QA skipped because MERIT_SKIP_QA=1"
  exit 0
fi

cd "$REPO_ROOT"

echo "==> Resolving Flutter dependencies..."
flutter pub get

echo "==> Running mandatory Flutter test suite..."
flutter test

echo "==> Running focused parser/rendering analyzer check..."
dart analyze \
  lib/app/app_controller.dart \
  lib/app/api_client.dart \
  lib/app/data/api_app_repository.dart \
  lib/app/models.dart \
  lib/features/admin/clipboard_image_stub.dart \
  lib/features/admin/clipboard_image_web.dart \
  lib/math/math_content.dart \
  lib/widgets/math_text.dart \
  lib/widgets/rich_math_content.dart \
  test/api_client_test.dart \
  test/api_repository_contract_test.dart \
  test/auth_entry_widget_test.dart \
  test/math_formatter_test.dart \
  test/math_content_parser_test.dart \
  test/portal_workflow_test.dart

echo "==> Running Node API syntax gate..."
node --check server/src/index.js
node --check scripts/prod_authenticated_endpoint_sweep.mjs

echo "==> Running marketing frontend production build gate..."
pushd "$REPO_ROOT/marketing" > /dev/null
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
npm run build
if [[ "${MERIT_STRICT_MARKETING_LINT:-0}" == "1" ]]; then
  echo "==> Running strict marketing lint gate..."
  npm run lint
else
  echo "==> Marketing lint is currently non-blocking. Set MERIT_STRICT_MARKETING_LINT=1 to enforce it."
fi
popd > /dev/null

echo "==> Local regression suite passed."
