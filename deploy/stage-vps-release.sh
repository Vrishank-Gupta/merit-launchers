#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: stage-vps-release.sh [options]

Options:
  --runtime                 Include runtime/api files
  --web                     Include full web bundle
  --marketing-site          Include marketing root files only
  --build-api               Mark release to rebuild the api image
  --release-id <id>         Override generated release id
  --vm-alias <target>       SSH target, for example root@example.com
  --vm-dir <dir>            Remote repo root, default /root/merit-launchers
  --skip-qa                 Skip local regression gate
  --schedule-at <iso8601>   Reserved for parity with the PowerShell script
EOF
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME=0
WEB=0
MARKETING_SITE=0
BUILD_API=0
SKIP_QA=0
RELEASE_ID=""
SCHEDULE_AT=""
VM_ALIAS="${VM_ALIAS:-myvps}"
VM_DIR="${VM_DIR:-/root/merit-launchers}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runtime)
      RUNTIME=1
      shift
      ;;
    --web)
      WEB=1
      shift
      ;;
    --marketing-site)
      MARKETING_SITE=1
      shift
      ;;
    --build-api)
      BUILD_API=1
      shift
      ;;
    --release-id)
      RELEASE_ID="$2"
      shift 2
      ;;
    --schedule-at)
      SCHEDULE_AT="$2"
      shift 2
      ;;
    --vm-alias)
      VM_ALIAS="$2"
      shift 2
      ;;
    --vm-dir)
      VM_DIR="$2"
      shift 2
      ;;
    --skip-qa)
      SKIP_QA=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$RUNTIME" != "1" && "$WEB" != "1" && "$MARKETING_SITE" != "1" ]]; then
  echo "Select at least one of --runtime, --web, or --marketing-site." >&2
  exit 1
fi

if [[ -z "$RELEASE_ID" ]]; then
  RELEASE_ID="release-$(date -u +%Y%m%d-%H%M%S)"
fi

STAGE_ROOT="$REPO_ROOT/.deploy-staging/$RELEASE_ID"
TAR_PATH="$REPO_ROOT/deploy/$RELEASE_ID.tar.gz"

rm -rf "$STAGE_ROOT"
mkdir -p "$STAGE_ROOT"

if [[ "$SKIP_QA" != "1" ]]; then
  echo "==> Running mandatory QA before staging..."
  "$REPO_ROOT/deploy/run-local-regression.sh"
  export MERIT_QA_ALREADY_RAN=1
fi

components=()
restart_api=false
restart_nginx=false

copy_dir_contents() {
  local src="$1"
  local dest="$2"
  mkdir -p "$dest"
  cp -R "$src"/. "$dest"/
}

if [[ "$MARKETING_SITE" == "1" ]]; then
  echo "==> Building marketing site locally..."
  pushd "$REPO_ROOT/marketing" > /dev/null
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  npm run build
  popd > /dev/null

  target="$STAGE_ROOT/marketing-site-root"
  mkdir -p "$target"
  copy_dir_contents "$REPO_ROOT/marketing/dist" "$target"
  components+=("marketing_site_root")
  restart_nginx=true
fi

if [[ "$WEB" == "1" ]]; then
  echo "==> Building full web bundle locally..."
  bash "$REPO_ROOT/deploy/build-admin-web.sh"
  target="$STAGE_ROOT/admin-web"
  mkdir -p "$target"
  copy_dir_contents "$REPO_ROOT/deploy/admin-web" "$target"
  components+=("web_bundle")
  restart_nginx=true
fi

if [[ "$RUNTIME" == "1" ]]; then
  echo "==> Staging runtime/api files..."
  runtime_root="$STAGE_ROOT/runtime"
  mkdir -p \
    "$runtime_root/server/fontconfig" \
    "$runtime_root/server/src" \
    "$runtime_root/server/sql" \
    "$runtime_root/scripts" \
    "$runtime_root/deploy/nginx"

  cp "$REPO_ROOT/docker-compose.yml" "$runtime_root/docker-compose.yml"
  cp "$REPO_ROOT/server/Dockerfile" "$runtime_root/server/Dockerfile"
  cp "$REPO_ROOT/server/package.json" "$runtime_root/server/package.json"
  cp "$REPO_ROOT/server/package-lock.json" "$runtime_root/server/package-lock.json"
  copy_dir_contents "$REPO_ROOT/server/fontconfig" "$runtime_root/server/fontconfig"
  copy_dir_contents "$REPO_ROOT/server/src" "$runtime_root/server/src"
  copy_dir_contents "$REPO_ROOT/server/sql" "$runtime_root/server/sql"
  cp "$REPO_ROOT/scripts/prod_authenticated_endpoint_sweep.mjs" "$runtime_root/scripts/prod_authenticated_endpoint_sweep.mjs"
  cp "$REPO_ROOT/deploy/nginx/default.conf" "$runtime_root/deploy/nginx/default.conf"

  components+=("runtime")
  restart_api=true
  restart_nginx=true
fi

python3 - <<'PY' "$STAGE_ROOT/manifest.json" "$RELEASE_ID" "$BUILD_API" "$restart_api" "$restart_nginx" "${components[@]}"
import json
import sys

path = sys.argv[1]
release_id = sys.argv[2]
build_api = sys.argv[3] == "1"
restart_api = sys.argv[4].lower() == "true"
restart_nginx = sys.argv[5].lower() == "true"
components = sys.argv[6:]

manifest = {
    "releaseId": release_id,
    "createdAt": __import__("datetime").datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
    "components": components,
    "buildApi": build_api,
    "restartApi": restart_api,
    "restartNginx": restart_nginx,
}

with open(path, "w", encoding="utf-8") as fh:
    json.dump(manifest, fh, indent=2)
    fh.write("\n")
PY

rm -f "$TAR_PATH"
echo "==> Packaging release tarball..."
tar -czf "$TAR_PATH" -C "$STAGE_ROOT" .

echo "==> Uploading release tarball and VPS deploy scripts..."
ssh "$VM_ALIAS" "mkdir -p '$VM_DIR/deploy/vps-releases/incoming'"
scp "$TAR_PATH" "$VM_ALIAS:$VM_DIR/deploy/vps-releases/incoming/$RELEASE_ID.tar.gz"
scp "$REPO_ROOT/deploy/vps-run-smoke.sh" "$VM_ALIAS:$VM_DIR/deploy/vps-run-smoke.sh"
scp "$REPO_ROOT/deploy/vps-deploy-release.sh" "$VM_ALIAS:$VM_DIR/deploy/vps-deploy-release.sh"
scp "$REPO_ROOT/deploy/vps-rollback-release.sh" "$VM_ALIAS:$VM_DIR/deploy/vps-rollback-release.sh"
ssh "$VM_ALIAS" "chmod 755 '$VM_DIR/deploy/vps-run-smoke.sh' '$VM_DIR/deploy/vps-deploy-release.sh' '$VM_DIR/deploy/vps-rollback-release.sh'"

if [[ -n "$SCHEDULE_AT" ]]; then
  echo "Schedule requests are not implemented in the bash staging path yet." >&2
  exit 1
fi

echo "==> Release staged successfully."
echo "Release ID: $RELEASE_ID"
echo "Tarball: $TAR_PATH"
