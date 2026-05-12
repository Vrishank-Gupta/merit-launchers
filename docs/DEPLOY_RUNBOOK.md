# Merit Launchers Deploy Runbook

This document is the canonical deployment guide for the `merit_launchers` repo.

It is written so that a human or another coding agent can deploy the system safely without guessing hidden steps. It covers:

- local prerequisites
- production server layout
- runtime-only deploys
- web deploys
- staged release deploys
- required permission normalization
- post-deploy smoke checks
- rollback behavior
- outage recovery notes

## Scope

This repo deploys three main production layers:

- API runtime: Node/Express app in `server/`, running in Docker as `merit-launchers-api`
- Postgres: Docker container `merit-launchers-postgres`
- Nginx + static site bundle: Docker container `merit-launchers-nginx`

The static web bundle served by Nginx contains:

- marketing site at `/`
- student Flutter app at `/portal/`
- admin Flutter app at `/admin/`
- marketing Flutter console at `/marketing/`

## Production Host Assumptions

Current production conventions in code:

- SSH alias: `myvps`
- server root: `/root/merit-launchers`
- docker compose file: `/root/merit-launchers/docker-compose.yml`
- public static root mounted into nginx from: `/root/merit-launchers/deploy/admin-web`
- nginx config file: `/root/merit-launchers/deploy/nginx/default.conf`
- release workspace root on server: `/root/merit-launchers/deploy/vps-releases`

## Important Files

Core deploy entrypoints:

- [deploy.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy.ps1)
- [deploy/stage-vps-release.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\stage-vps-release.ps1)
- [deploy/vps-deploy-release.sh](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\vps-deploy-release.sh)
- [deploy/vps-run-smoke.sh](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\vps-run-smoke.sh)

Build and validation:

- [deploy/build-admin-web.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\build-admin-web.ps1)
- [deploy/build-admin-web.sh](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\build-admin-web.sh)
- [deploy/run-local-regression.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\run-local-regression.ps1)
- [deploy/run-qa.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\run-qa.ps1)
- [deploy/run-prod-smoke.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\run-prod-smoke.ps1)
- [deploy/run-prod-auth-smoke.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\run-prod-auth-smoke.ps1)
- [deploy/run-prod-portal-smoke.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\run-prod-portal-smoke.ps1)
- [deploy/run-prod-web-smoke.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\run-prod-web-smoke.ps1)
- [deploy/run-prod-browser-smoke.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\run-prod-browser-smoke.ps1)
- [deploy/run-prod-endpoint-regression.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\run-prod-endpoint-regression.ps1)
- [deploy/run-full-regression.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\run-full-regression.ps1)
- [tools/playwright-runner/prod_site_smoke.js](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\tools\playwright-runner\prod_site_smoke.js)

## Local Prerequisites

On the deployment machine:

- PowerShell available
- Git available
- `ssh` and `scp` available
- `tar` available
- Node/npm available
- Flutter installed at `C:\Users\VRISHANK\tools\flutter\bin\flutter.bat`
- Playwright dependencies already installed in `tools/playwright-runner/node_modules`

Expected SSH access:

- `ssh myvps`

## Environment and Secrets

Local production smoke scripts may optionally use these environment variables:

- `MERIT_QA_ADMIN_EMAIL`
- `MERIT_QA_ADMIN_PASSWORD`
- `MERIT_QA_STUDENT_EMAIL`
- `MERIT_QA_STUDENT_PASSWORD`
- `MERIT_QA_MARKETING_ADMIN_EMAIL`
- `MERIT_QA_MARKETING_ADMIN_PASSWORD`
- `MERIT_QA_PARTNER_EMAIL`
- `MERIT_QA_PARTNER_PASSWORD`
- `CMS_ADMIN_EMAIL`
- `CMS_ADMIN_PASSWORD`

Server-side staged release smoke can also load:

- `/root/merit-launchers/deploy/vps-qa.env`

Do not hardcode secrets into repo files.

## What `docker-compose.yml` Serves

From [docker-compose.yml](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\docker-compose.yml):

- `postgres` runs on container name `merit-launchers-postgres`
- `api` runs on container name `merit-launchers-api`
- `nginx` runs on container name `merit-launchers-nginx`

Important mounts:

- `./deploy/admin-web:/usr/share/nginx/html:ro`
- `./deploy/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro`
- `./server/toolkit-files:/usr/share/nginx/toolkit-files:ro`
- `./server/blog-images:/usr/share/nginx/blog-images:ro`

This means any web deploy must ultimately update files under:

- `/root/merit-launchers/deploy/admin-web`

## Deployment Modes

There are two real production deploy paths:

1. Direct deploy from local machine using `deploy.ps1`
2. Staged release deploy using `stage-vps-release.ps1` + `vps-deploy-release.sh`

Use the direct path for fast, normal deploys.
Use the staged release path when you want a tarballed release, server-side rollback, or scheduled deployment.

---

## 1. Direct Deploy: `deploy.ps1`

### What it does

`deploy.ps1`:

- runs local regression gate
- pushes current Git branch
- syncs runtime files to server
- restarts or rebuilds API
- runs production API/auth/portal smoke
- if `-Web` is set:
  - builds web bundle locally
  - uploads `deploy/admin-web`
  - normalizes server file permissions
  - restarts nginx
  - runs production web smoke
  - runs browser smoke

### Commands

Runtime only:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```

Runtime with API rebuild:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Build
```

Web + runtime:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Web
```

Web + runtime + API rebuild:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Build -Web
```

### Exact runtime sync performed

The direct deploy syncs these files to the server via tar stream:

- `docker-compose.yml`
- `server/Dockerfile`
- `server/package.json`
- `server/package-lock.json`
- `server/src`
- `server/sql`
- `scripts/prod_authenticated_endpoint_sweep.mjs`
- `deploy/nginx/default.conf`

It sends them into:

- `/root/merit-launchers`

### Exact web upload performed

If `-Web` is used, local `deploy/admin-web` is tar-streamed into:

- `/root/merit-launchers/deploy/admin-web`

### Required permission normalization

After web upload, `deploy.ps1` runs:

```bash
find deploy/admin-web -type d -exec chmod 755 {} +
find deploy/admin-web -type f -exec chmod 644 {} +
docker compose restart nginx
```

This is mandatory. Do not skip it.

It prevents bad permissions on copied assets from breaking static file serving.

### Direct deploy caveat

`deploy.ps1` does not do automatic rollback.
If something breaks after a direct deploy, you must either:

- redeploy a known-good bundle
- restore files manually
- or use the staged release path next time

---

## 2. Staged Release Deploy

Use this when you want:

- a release tarball
- explicit manifest of deployed components
- automatic server-side rollback on failure
- optional scheduled execution

### Step A: stage a release locally

Examples:

Stage runtime only:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\stage-vps-release.ps1 -Runtime
```

Stage web only:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\stage-vps-release.ps1 -Web
```

Stage marketing site root only:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\stage-vps-release.ps1 -MarketingSite
```

Stage web + runtime:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\stage-vps-release.ps1 -Runtime -Web
```

Stage web + runtime + API rebuild:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\stage-vps-release.ps1 -Runtime -Web -BuildApi
```

Stage and schedule:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\stage-vps-release.ps1 -Runtime -Web -ScheduleAt "2026-05-12T23:30:00+05:30"
```

### What local staging creates

Under:

- `.deploy-staging/<release-id>/`

It creates:

- `manifest.json`
- `admin-web/` if `-Web`
- `marketing-site-root/` if `-MarketingSite`
- `runtime/` if `-Runtime`

Then it creates:

- `deploy/<release-id>.tar.gz`

Then uploads:

- release tarball to `/root/merit-launchers/deploy/vps-releases/incoming/<release-id>.tar.gz`
- `deploy/vps-run-smoke.sh`
- `deploy/vps-deploy-release.sh`

And sets script permissions:

```bash
chmod 755 /root/merit-launchers/deploy/vps-run-smoke.sh /root/merit-launchers/deploy/vps-deploy-release.sh
```

### Step B: apply the release on server

Usually the script itself schedules or prepares this, but the server-side apply command is:

```bash
/root/merit-launchers/deploy/vps-deploy-release.sh --release-id <release-id>
```

or:

```bash
/root/merit-launchers/deploy/vps-deploy-release.sh --release-tar /root/merit-launchers/deploy/vps-releases/incoming/<release-id>.tar.gz
```

### What the server-side release script does

`vps-deploy-release.sh`:

- extracts tarball into a work dir
- reads `manifest.json`
- backs up currently deployed components
- applies only the selected components
- restarts API if needed
- restarts nginx if needed
- runs `deploy/vps-run-smoke.sh`
- rolls back automatically if anything fails before completion

### Backup locations

Backups go under:

- `/root/merit-launchers/deploy/vps-releases/backups/<release-id>/`

Work directories go under:

- `/root/merit-launchers/deploy/vps-releases/work/<release-id>/`

Logs go under:

- `/root/merit-launchers/deploy/vps-releases/logs/<release-id>.log`

### Automatic rollback behavior

Rollback is triggered by script failure before successful completion.

Restored components may include:

- `deploy/admin-web`
- marketing site root files under `deploy/admin-web`
- `docker-compose.yml`
- `server/Dockerfile`
- `server/package.json`
- `server/package-lock.json`
- `server/src`
- `server/sql`
- `scripts/prod_authenticated_endpoint_sweep.mjs`
- `deploy/nginx/default.conf`

During rollback it may run:

```bash
docker compose -f /root/merit-launchers/docker-compose.yml up -d --build api
```

or:

```bash
docker compose -f /root/merit-launchers/docker-compose.yml restart api
docker compose -f /root/merit-launchers/docker-compose.yml restart nginx
```

Then it runs post-rollback smoke if available.

---

## Web Build Details

### Canonical local builder on Windows

Use:

- [deploy/build-admin-web.ps1](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\build-admin-web.ps1)

It builds:

- marketing React site into `deploy/marketing-site`
- Flutter web app for `/portal/`
- Flutter web app for `/admin/`
- Flutter web app for `/marketing/`

Then it assembles everything into:

- `deploy/admin-web`

### Canonical local/CI builder on Linux

Use:

- [deploy/build-admin-web.sh](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\build-admin-web.sh)

The Linux script must stay in parity with the PowerShell script.

### Critical service-worker rule

All Flutter surfaces must disable the generated Flutter service worker bootstrap.

Expected deployed state:

- `flutter_bootstrap.js` must contain `serviceWorkerSettings: null`
- `flutter_service_worker.js` must be replaced by the kill-switch version

Why:

- stale service workers can strand `/admin/`, `/portal/`, or `/marketing/` on their startup shell
- this already caused a production incident

### Kill-switch worker behavior

The kill-switch worker:

- calls `self.skipWaiting()`
- clears cache storage
- unregisters itself
- navigates clients back to their current URL
- no-ops fetch handling

Do not revert this behavior without replacing it with another deterministic cache-busting strategy.

---

## Validation Gates

## Local regression gate

`run-local-regression.ps1` runs:

- Flutter gate via `run-qa.ps1`
- `node --check server/src/index.js`
- `node --check scripts/prod_authenticated_endpoint_sweep.mjs`
- marketing `npm run build`
- optional strict marketing lint if `MERIT_STRICT_MARKETING_LINT=1`

`run-qa.ps1` runs:

- `flutter test`
- focused `dart analyze` on core app/parser/rendering files

## Emergency QA bypass

For urgent outage recovery only, local QA can be bypassed by:

```powershell
$env:MERIT_SKIP_QA='1'
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Web
```

Use this only if:

- the outage is active
- the change is narrow and understood
- you follow with strong production smoke checks

This bypass skips `run-qa.ps1` because `run-qa.ps1` exits early when `MERIT_SKIP_QA=1`.

---

## Post-Deploy Smoke Checks

### API smoke

`run-prod-smoke.ps1` performs core production API checks.

### Auth smoke

`run-prod-auth-smoke.ps1` checks password-login flows if QA credentials are configured.

### Partner/marketing-admin portal smoke

`run-prod-portal-smoke.ps1` checks:

- `/partner/login`
- `/marketing-admin/login`
- `/join/ADMIN`
- marketing-admin login/profile/pending/network
- optional partner auth/profile/network if partner credentials are configured

### Web smoke

`run-prod-web-smoke.ps1` now verifies:

- marketing routes return 200
- `/partner/login`, `/marketing-admin/login`, `/join/ADMIN` return 200
- `/admin/`, `/portal/`, `/marketing/` contain correct base hrefs
- `Cache-Control` for `index.html`, `flutter_bootstrap.js`, and `main.dart.js` is non-cacheable
- `/admin/flutter_bootstrap.js`, `/portal/flutter_bootstrap.js`, `/marketing/flutter_bootstrap.js` contain `serviceWorkerSettings: null`
- all three Flutter surfaces expose the kill-switch `flutter_service_worker.js`
- `/api/v1/bootstrap` returns course data

### Browser smoke

`run-prod-browser-smoke.ps1` runs Playwright against live production and checks:

- marketing home
- faq
- contact
- partner login
- marketing-admin login
- join/ADMIN
- student portal
- admin portal
- marketing console

The browser smoke fails if:

- a Flutter surface never hides `#ml-startup-shell`
- expected Flutter DOM surfaces never appear
- first-party requests fail
- real console/runtime errors appear

Third-party analytics failures are intentionally ignored.

### Server-side staged release smoke

`vps-run-smoke.sh` checks:

- public reachability from `deploy/vps-reachability-checks.txt`
- admin and portal bootstrap service worker state
- `/api/v1/bootstrap`
- container-level API mutation/retrieval flow
- optional auth smoke
- authenticated endpoint sweep

---

## File Permission Rules

These permissions matter in production:

### Web bundle files after direct web deploy

Run:

```bash
find /root/merit-launchers/deploy/admin-web -type d -exec chmod 755 {} +
find /root/merit-launchers/deploy/admin-web -type f -exec chmod 644 {} +
```

### Deployed helper scripts for staged release

Run:

```bash
chmod 755 /root/merit-launchers/deploy/vps-run-smoke.sh
chmod 755 /root/merit-launchers/deploy/vps-deploy-release.sh
```

### Scheduled marketing root deploy script

If used:

- [deploy/run-scheduled-marketing-deploy-20260428-0200.sh](C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\deploy\run-scheduled-marketing-deploy-20260428-0200.sh)

It normalizes:

- directories to `755`
- files to `644`
- then restarts nginx

This same pattern should be preserved in future one-off deploy helpers.

---

## Common Operational Commands

Check container state:

```bash
cd /root/merit-launchers && docker compose ps
```

Restart API only:

```bash
cd /root/merit-launchers && docker compose restart api
```

Rebuild API:

```bash
cd /root/merit-launchers && docker compose up -d --build api
```

Restart nginx:

```bash
cd /root/merit-launchers && docker compose restart nginx
```

Check health endpoint from server:

```bash
curl -s http://127.0.0.1:8080/health
```

Check live bootstrap:

```bash
curl -fsSL https://meritlaunchers.com/api/v1/bootstrap
```

Check live admin bootstrap service-worker state:

```bash
curl -fsSL https://meritlaunchers.com/admin/flutter_bootstrap.js | grep "serviceWorkerSettings"
```

Check live admin index:

```bash
curl -I https://meritlaunchers.com/admin/
```

---

## Incident Note: Admin Portal Stuck on Loading Shell

The production outage on May 12, 2026 was caused by a bad deployed Flutter bootstrap on `/admin/`.

Symptoms:

- admin portal never advanced past startup loading card
- browser console showed `prepareServiceWorker` timeout warnings
- API remained healthy

Root cause:

- production served an older or incorrectly rebuilt `flutter_bootstrap.js`
- service workers were still enabled in production bootstrap
- browser startup stalled before the Flutter app fully rendered

Fixes already applied:

- Linux build script now matches PowerShell build behavior
- post-deploy web smoke now validates all Flutter surfaces
- browser-level production smoke now catches startup-shell hangs

If this symptom returns:

1. inspect `/admin/flutter_bootstrap.js`
2. verify it contains `serviceWorkerSettings: null`
3. redeploy web bundle
4. normalize permissions
5. rerun `run-prod-web-smoke.ps1`
6. rerun `run-prod-browser-smoke.ps1`

---

## Recommended Default Deploy Paths

For most normal production changes:

- runtime only: `.\deploy.ps1`
- runtime + web: `.\deploy.ps1 -Web`
- runtime + web + rebuild API: `.\deploy.ps1 -Build -Web`

For high-risk or scheduled releases:

- `.\deploy\stage-vps-release.ps1 -Runtime -Web -BuildApi`
- then execute or schedule `vps-deploy-release.sh`

---

## Non-Negotiables

- Never deploy Flutter web without the service-worker bootstrap disable + kill-switch step.
- Never skip post-deploy smoke for production.
- Never upload `deploy/admin-web` and forget the permission normalization.
- Never assume API health means portal health; always check browser startup for Flutter surfaces.
- Keep `build-admin-web.ps1` and `build-admin-web.sh` behaviorally in sync.
