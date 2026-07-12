#!/usr/bin/env bash
set -eu

STATE_DIR="/root/codex-workspaces/merit-launchers-main/.ops/dns-challenge"
safe_domain="${CERTBOT_DOMAIN//[^a-zA-Z0-9.-]/_}"
mkdir -p "$STATE_DIR"
printf '%s\n' "$CERTBOT_VALIDATION" > "$STATE_DIR/$safe_domain.value"
rm -f "$STATE_DIR/$safe_domain.continue"

for _ in $(seq 1 180); do
  [[ -f "$STATE_DIR/$safe_domain.continue" ]] && exit 0
  sleep 10
done

echo "Timed out waiting for DNS confirmation for $CERTBOT_DOMAIN" >&2
exit 1
