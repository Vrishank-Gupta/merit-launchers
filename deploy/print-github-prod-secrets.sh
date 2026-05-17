#!/usr/bin/env bash
set -euo pipefail

KEY_PATH="${HOME}/.ssh/merit_launchers_actions"
PUB_PATH="${KEY_PATH}.pub"
HOST_LINE="87.232.72.72 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIM0afpRfrVNtFcejch/bO7vdxkWXUQdonQaOFmGHTzfR"

if [[ ! -f "$KEY_PATH" ]]; then
  echo "Missing private key at $KEY_PATH" >&2
  exit 1
fi

echo "GitHub repository secrets to add:"
echo
echo "PROD_SSH_TARGET"
echo "root@87.232.72.72"
echo
echo "PROD_SSH_KNOWN_HOSTS"
echo "$HOST_LINE"
echo
echo "PROD_SSH_PRIVATE_KEY"
cat "$KEY_PATH"
echo
echo "Installed public key on VPS:"
cat "$PUB_PATH"
