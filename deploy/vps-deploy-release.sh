#!/usr/bin/env bash
set -euo pipefail

VM_DIR="${VM_DIR:-/root/merit-launchers}"
DEPLOY_DIR="${DEPLOY_DIR:-${VM_DIR}/deploy/vps-releases}"
INCOMING_DIR="${INCOMING_DIR:-${DEPLOY_DIR}/incoming}"
WORK_DIR="${WORK_DIR:-${DEPLOY_DIR}/work}"
BACKUP_DIR="${BACKUP_DIR:-${DEPLOY_DIR}/backups}"
LOG_DIR="${LOG_DIR:-${DEPLOY_DIR}/logs}"
SMOKE_SCRIPT_REL="deploy/vps-run-smoke.sh"

release_id=""
release_tar=""
base_url="${BASE_URL:-https://meritlaunchers.com}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release-id)
      release_id="$2"
      shift 2
      ;;
    --release-tar)
      release_tar="$2"
      shift 2
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

if [[ -z "$release_tar" ]]; then
  if [[ -z "$release_id" ]]; then
    echo "Provide --release-id or --release-tar" >&2
    exit 1
  fi
  release_tar="${INCOMING_DIR}/${release_id}.tar.gz"
fi

if [[ -z "$release_id" ]]; then
  release_id="$(basename "$release_tar" .tar.gz)"
fi

mkdir -p "$INCOMING_DIR" "$WORK_DIR" "$BACKUP_DIR" "$LOG_DIR"

release_work="${WORK_DIR}/${release_id}"
backup_root="${BACKUP_DIR}/${release_id}"
log_path="${LOG_DIR}/${release_id}.log"
rm -rf "$release_work" "$backup_root"
mkdir -p "$release_work" "$backup_root"

exec > >(tee -a "$log_path") 2>&1

echo "==> Starting VPS release ${release_id}"
echo "==> Release tar: ${release_tar}"

if [[ ! -f "$release_tar" ]]; then
  echo "Release tar not found: $release_tar" >&2
  exit 1
fi

tar -xzf "$release_tar" -C "$release_work"

manifest_path="${release_work}/manifest.json"
if [[ ! -f "$manifest_path" ]]; then
  echo "manifest.json missing from release tar." >&2
  exit 1
fi

readarray -t manifest_data < <(python3 - <<'PY' "$manifest_path"
import json, sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)
components = data.get("components") or []
build_api = "1" if data.get("buildApi") else "0"
restart_api = "1" if data.get("restartApi") else "0"
restart_nginx = "1" if data.get("restartNginx") else "0"
print(",".join(components))
print(build_api)
print(restart_api)
print(restart_nginx)
PY
)

components_csv="${manifest_data[0]:-}"
build_api="${manifest_data[1]:-0}"
restart_api="${manifest_data[2]:-0}"
restart_nginx="${manifest_data[3]:-0}"

contains_component() {
  local name="$1"
  [[ ",${components_csv}," == *",${name},"* ]]
}

rollback_needed=0

backup_path() {
  local rel="$1"
  local src="${VM_DIR}/${rel}"
  local dest="${backup_root}/${rel}"
  mkdir -p "$(dirname "$dest")"
  if [[ -e "$src" ]]; then
    rm -rf "$dest"
    if [[ -d "$src" ]]; then
      mkdir -p "$dest"
      rsync -a "${src}/" "$dest/"
    else
      rsync -a "$src" "$dest"
    fi
  fi
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

rollback() {
  if [[ "$rollback_needed" != "1" ]]; then
    return
  fi
  echo "==> Rolling back release ${release_id}"
  contains_component marketing_site_root && restore_path "deploy/admin-web-root-backup"
  contains_component web_bundle && restore_path "deploy/admin-web"
  contains_component runtime && {
    restore_path "docker-compose.yml"
    restore_path "server/Dockerfile"
    restore_path "server/package.json"
    restore_path "server/package-lock.json"
    restore_path "server/src"
    restore_path "server/sql"
    restore_path "scripts/prod_authenticated_endpoint_sweep.mjs"
    restore_path "deploy/nginx/default.conf"
  }

  if contains_component runtime; then
    if [[ "$build_api" == "1" ]]; then
      docker compose -f "${VM_DIR}/docker-compose.yml" up -d --build api
    else
      docker compose -f "${VM_DIR}/docker-compose.yml" restart api
    fi
  fi
  if contains_component web_bundle || contains_component marketing_site_root || contains_component runtime || [[ "$restart_nginx" == "1" ]]; then
    docker compose -f "${VM_DIR}/docker-compose.yml" restart nginx
  fi
  if [[ -x "${VM_DIR}/${SMOKE_SCRIPT_REL}" ]]; then
    echo "==> Running post-rollback smoke verification"
    BASE_URL="$base_url" VM_DIR="$VM_DIR" bash "${VM_DIR}/${SMOKE_SCRIPT_REL}" || true
  fi
  echo "==> Rollback completed"
}

trap 'status=$?; if [[ $status -ne 0 ]]; then rollback; fi; exit $status' EXIT

if contains_component marketing_site_root; then
  echo "==> Backing up current marketing-site root"
  mkdir -p "${backup_root}/deploy/admin-web-root-backup"
  shopt -s dotglob nullglob
  for item in "${VM_DIR}/deploy/admin-web"/*; do
    name="$(basename "$item")"
    if [[ "$name" == "admin" || "$name" == "portal" || "$name" == "marketing" ]]; then
      continue
    fi
    rsync -a "$item" "${backup_root}/deploy/admin-web-root-backup/"
  done
  shopt -u dotglob nullglob
fi

if contains_component web_bundle; then
  echo "==> Backing up current full web bundle"
  backup_path "deploy/admin-web"
fi

if contains_component runtime; then
  echo "==> Backing up runtime files"
  backup_path "docker-compose.yml"
  backup_path "server/Dockerfile"
  backup_path "server/package.json"
  backup_path "server/package-lock.json"
  backup_path "server/src"
  backup_path "server/sql"
  backup_path "scripts/prod_authenticated_endpoint_sweep.mjs"
  backup_path "deploy/nginx/default.conf"
fi

rollback_needed=1

if contains_component marketing_site_root; then
  echo "==> Applying staged marketing-site root"
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
  rsync -a --delete "${release_work}/marketing-site-root/" "${VM_DIR}/deploy/admin-web/"
fi

if contains_component web_bundle; then
  echo "==> Applying staged full web bundle"
  rm -rf "${VM_DIR}/deploy/admin-web"
  mkdir -p "${VM_DIR}/deploy/admin-web"
  rsync -a --delete "${release_work}/admin-web/" "${VM_DIR}/deploy/admin-web/"
fi

if contains_component runtime; then
  echo "==> Applying staged runtime files"
  rsync -a "${release_work}/runtime/docker-compose.yml" "${VM_DIR}/docker-compose.yml"
  rsync -a "${release_work}/runtime/server/Dockerfile" "${VM_DIR}/server/Dockerfile"
  rsync -a "${release_work}/runtime/server/package.json" "${VM_DIR}/server/package.json"
  rsync -a "${release_work}/runtime/server/package-lock.json" "${VM_DIR}/server/package-lock.json"
  rsync -a --delete "${release_work}/runtime/server/src/" "${VM_DIR}/server/src/"
  rsync -a --delete "${release_work}/runtime/server/sql/" "${VM_DIR}/server/sql/"
  mkdir -p "${VM_DIR}/scripts"
  rsync -a "${release_work}/runtime/scripts/prod_authenticated_endpoint_sweep.mjs" "${VM_DIR}/scripts/prod_authenticated_endpoint_sweep.mjs"
  rsync -a "${release_work}/runtime/deploy/nginx/default.conf" "${VM_DIR}/deploy/nginx/default.conf"
fi

if contains_component runtime; then
  echo "==> Restarting api"
  if [[ "$build_api" == "1" ]]; then
    docker compose -f "${VM_DIR}/docker-compose.yml" up -d --build api
  elif [[ "$restart_api" == "1" ]]; then
    docker compose -f "${VM_DIR}/docker-compose.yml" restart api
  fi
fi

if contains_component web_bundle || contains_component marketing_site_root || contains_component runtime || [[ "$restart_nginx" == "1" ]]; then
  echo "==> Restarting nginx"
  docker compose -f "${VM_DIR}/docker-compose.yml" restart nginx
fi

echo "==> Running smoke and reachability suite"
BASE_URL="$base_url" VM_DIR="$VM_DIR" bash "${VM_DIR}/${SMOKE_SCRIPT_REL}"

rollback_needed=0
echo "==> Release ${release_id} deployed successfully"
