#!/usr/bin/env bash
set -euo pipefail

VM_DIR="${VM_DIR:-/root/merit-launchers}"
DEPLOY_DIR="${DEPLOY_DIR:-${VM_DIR}/deploy/vps-releases}"
BACKUP_DIR="${BACKUP_DIR:-${DEPLOY_DIR}/backups}"
LOG_DIR="${LOG_DIR:-${DEPLOY_DIR}/logs}"
STATE_DIR="${STATE_DIR:-${DEPLOY_DIR}/state}"
CURRENT_RELEASE_PATH="${CURRENT_RELEASE_PATH:-${STATE_DIR}/current-release.json}"
HISTORY_PATH="${HISTORY_PATH:-${STATE_DIR}/release-history.jsonl}"
SMOKE_SCRIPT_REL="deploy/vps-run-smoke.sh"

release_id=""
use_latest=0
base_url="${BASE_URL:-https://meritlaunchers.com}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release-id)
      release_id="$2"
      shift 2
      ;;
    --latest)
      use_latest=1
      shift
      ;;
    --base-url)
      base_url="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

mkdir -p "$BACKUP_DIR" "$LOG_DIR" "$STATE_DIR"

if [[ "$use_latest" == "1" && -n "$release_id" ]]; then
  echo "Use either --latest or --release-id, not both." >&2
  exit 1
fi

if [[ "$use_latest" == "1" ]]; then
  if [[ ! -f "$CURRENT_RELEASE_PATH" ]]; then
    echo "Current release metadata not found at $CURRENT_RELEASE_PATH" >&2
    exit 1
  fi
  release_id="$(python3 - <<'PY' "$CURRENT_RELEASE_PATH"
import json, sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
print(data.get("releaseId", ""))
PY
)"
fi

if [[ -z "$release_id" ]]; then
  echo "Provide --latest or --release-id." >&2
  exit 1
fi

backup_root="${BACKUP_DIR}/${release_id}"
if [[ ! -d "$backup_root" ]]; then
  echo "Backup not found for release ${release_id}: $backup_root" >&2
  exit 1
fi

log_path="${LOG_DIR}/${release_id}.rollback.log"
exec > >(tee -a "$log_path") 2>&1

echo "==> Rolling back release ${release_id}"

metadata_path="${backup_root}/backup-metadata.json"
if [[ -f "$metadata_path" ]]; then
  readarray -t metadata < <(python3 - <<'PY' "$metadata_path"
import json, sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
components = data.get("components") or []
print(",".join(components))
print(data.get("previousReleaseId") or "")
print("1" if data.get("buildApi") else "0")
print("1" if data.get("restartNginx") else "0")
PY
  )
else
  components=()
  [[ -d "${backup_root}/deploy/admin-web" ]] && components+=("web_bundle")
  [[ -d "${backup_root}/deploy/admin-web-root-backup" ]] && components+=("marketing_site_root")
  [[ -e "${backup_root}/docker-compose.yml" ]] && components+=("runtime")
  components_csv="$(IFS=,; echo "${components[*]}")"
  metadata=("$components_csv" "" "0" "0")
fi

components_csv="${metadata[0]:-}"
previous_release_id="${metadata[1]:-}"
build_api="${metadata[2]:-0}"
restart_nginx="${metadata[3]:-0}"

contains_component() {
  local name="$1"
  [[ ",${components_csv}," == *",${name},"* ]]
}

restore_path() {
  local rel="$1"
  local src="${backup_root}/${rel}"
  local dest="${VM_DIR}/${rel}"
  if [[ -e "$src" ]]; then
    rm -rf "$dest"
    if [[ -d "$src" ]]; then
      mkdir -p "$dest"
      rsync -a "${src}/" "$dest/"
    else
      mkdir -p "$(dirname "$dest")"
      rsync -a "$src" "$dest"
    fi
  else
    rm -rf "$dest"
  fi
}

if contains_component marketing_site_root; then
  echo "==> Restoring marketing-site root"
  mkdir -p "${VM_DIR}/deploy/admin-web"
  shopt -s dotglob nullglob
  for item in "${VM_DIR}/deploy/admin-web"/*; do
    name="$(basename "$item")"
    if [[ "$name" == "admin" || "$name" == "portal" || "$name" == "marketing" ]]; then
      continue
    fi
    rm -rf "$item"
  done
  shopt -u dotglob nullglob
  rsync -a "${backup_root}/deploy/admin-web-root-backup/" "${VM_DIR}/deploy/admin-web/"
fi

if contains_component web_bundle; then
  echo "==> Restoring full web bundle"
  restore_path "deploy/admin-web"
  find "${VM_DIR}/deploy/admin-web" -type d -exec chmod 755 {} +
  find "${VM_DIR}/deploy/admin-web" -type f -exec chmod 644 {} +
fi

if contains_component runtime; then
  echo "==> Restoring runtime files"
  restore_path "docker-compose.yml"
  restore_path "server/Dockerfile"
  restore_path "server/package.json"
  restore_path "server/package-lock.json"
  restore_path "server/fontconfig"
  restore_path "server/src"
  restore_path "server/sql"
  restore_path "scripts/prod_authenticated_endpoint_sweep.mjs"
  restore_path "deploy/nginx/default.conf"
fi

if contains_component runtime; then
  echo "==> Restarting api"
  if [[ "$build_api" == "1" ]]; then
    docker compose -f "${VM_DIR}/docker-compose.yml" up -d --build api
  else
    docker compose -f "${VM_DIR}/docker-compose.yml" restart api
  fi
fi

if contains_component web_bundle || contains_component marketing_site_root || contains_component runtime || [[ "$restart_nginx" == "1" ]]; then
  echo "==> Restarting nginx"
  docker compose -f "${VM_DIR}/docker-compose.yml" restart nginx
fi

if [[ -x "${VM_DIR}/${SMOKE_SCRIPT_REL}" ]]; then
  echo "==> Running post-rollback smoke verification"
  BASE_URL="$base_url" VM_DIR="$VM_DIR" bash "${VM_DIR}/${SMOKE_SCRIPT_REL}"
fi

python3 - <<'PY' "$CURRENT_RELEASE_PATH" "$HISTORY_PATH" "$release_id" "$previous_release_id"
import datetime
import json
import os
import sys

current_path, history_path, release_id, previous_release_id = sys.argv[1:5]
timestamp = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

state = {
    "releaseId": previous_release_id or "unknown",
    "deployedAt": timestamp,
    "restoredFromReleaseId": release_id,
    "state": "rolled_back",
}

os.makedirs(os.path.dirname(current_path), exist_ok=True)
with open(current_path, "w", encoding="utf-8") as fh:
    json.dump(state, fh, indent=2)
    fh.write("\n")

event = {
    "event": "rollback",
    "rolledBackReleaseId": release_id,
    "currentReleaseId": previous_release_id or "unknown",
    "timestamp": timestamp,
}

os.makedirs(os.path.dirname(history_path), exist_ok=True)
with open(history_path, "a", encoding="utf-8") as fh:
    fh.write(json.dumps(event) + "\n")
PY

echo "==> Rollback completed"
