#!/usr/bin/env bash
set -u

STATE_DIR="/root/codex-workspaces/merit-launchers-main/.ops/dns-challenge"
safe_domain="${CERTBOT_DOMAIN//[^a-zA-Z0-9.-]/_}"
rm -f "$STATE_DIR/$safe_domain.continue"
