#!/usr/bin/env bash
set -u

WORKSPACE="/root/codex-workspaces/merit-launchers-main"
LIVE_DIR="/root/merit-launchers"
WEBROOT="$LIVE_DIR/deploy/admin-web"
CERT="/etc/letsencrypt/live/meritlaunchers.com/fullchain.pem"
LOG="$WORKSPACE/.ops/finish-pr2-deploy.log"
DEADLINE=$(( $(date +%s) + 12 * 60 * 60 ))

mkdir -p "$(dirname "$LOG")" "$WEBROOT/.well-known/acme-challenge"
exec >>"$LOG" 2>&1

echo "[$(date -Is)] Scheduled TLS renewal and production deployment started."

while (( $(date +%s) < DEADLINE )); do
  echo "[$(date -Is)] Checking TLS certificate."

  if ! openssl x509 -checkend 86400 -noout -in "$CERT" >/dev/null 2>&1; then
    if certbot certonly \
      --webroot -w "$WEBROOT" \
      --cert-name meritlaunchers.com \
      -d meritlaunchers.com \
      -d www.meritlaunchers.com \
      --force-renewal \
      --non-interactive \
      --agree-tos; then
      docker compose -f "$LIVE_DIR/docker-compose.yml" restart nginx
      sleep 5
    else
      echo "[$(date -Is)] Certificate renewal not ready; retrying in 10 minutes."
      sleep 600
      continue
    fi
  fi

  if ! curl -sS -o /dev/null --connect-timeout 10 --max-time 20 https://registry-1.docker.io/v2/; then
    echo "[$(date -Is)] Docker Hub is unreachable; retrying in 10 minutes."
    sleep 600
    continue
  fi

  if ! curl -sS -o /dev/null --connect-timeout 10 --max-time 20 https://email.ap-south-1.amazonaws.com/; then
    echo "[$(date -Is)] AWS SES is unreachable; retrying in 10 minutes."
    sleep 600
    continue
  fi

  echo "[$(date -Is)] Prerequisites passed; updating and deploying main."
  if merit-phone update && merit-phone deploy full --skip-qa; then
    if curl -fsS --max-time 30 https://meritlaunchers.com/api/health >/dev/null; then
      echo "[$(date -Is)] Production deployment and health verification succeeded."
      exit 0
    fi
  fi

  echo "[$(date -Is)] Deployment did not complete; retrying in 15 minutes."
  sleep 900
done

echo "[$(date -Is)] Watcher deadline reached without a successful deployment."
exit 1
