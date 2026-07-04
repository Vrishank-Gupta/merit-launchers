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

echo "==> Building production-like API image for import regression tests..."
docker build -t merit-launchers-server-regression ./server

echo "==> Verifying document conversion binaries and running Node API tests..."
docker run --rm \
  -v "$REPO_ROOT/server/test:/app/test:ro" \
  merit-launchers-server-regression \
  sh -lc "command -v wmf2svg >/dev/null && command -v emf2svg-conv >/dev/null && command -v rsvg-convert >/dev/null && command -v convert >/dev/null && command -v tini >/dev/null && node --test test/import-v2.test.js test/math-svg.test.js test/omml-to-latex.test.js"

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
