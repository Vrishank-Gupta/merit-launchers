# Backup And Recovery

This project should be backed up in four separate buckets:

1. Code
2. Secrets
3. Production state
4. Uploaded assets

Do not rely on git alone. Git helps with code history, but it does not preserve:
- live environment files
- Android signing keys
- production database contents
- nginx / SSL material
- uploaded files
- current deployed web bundle

## Recommended Backup Layout

Create a timestamped backup folder on the external drive:

```text
<DRIVE>:\MeritLaunchersBackups\backup-YYYYMMDD-HHMMSS\
  code\
  secrets\
  production\
  assets\
  notes\
```

## What To Back Up

### 1. Code

Back up the repo, but exclude disposable/generated directories:

- `.dart_tool`
- `build`
- `tmp`
- `node_modules`
- `server/node_modules`
- `android/.gradle`
- `deploy/admin-web`

Git already has the source history, so this backup is mainly for convenience and fast migration.

### 2. Secrets

Back up these separately and store them encrypted:

- `server.env`
- `.env.prod`
- `.env.dev`
- `marketing/.env`
- `marketing/.env.local`
- `android/key.properties`
- `android/merit-launchers-upload.jks`
- any SSH keys used for VPS access
- any cloud credentials stored outside the repo

The `secrets` folder should be encrypted after backup using VeraCrypt or a password-protected 7z archive.

### 3. Production State

Back up these from the VPS:

- Postgres dump
- `docker-compose.yml`
- live `server.env`
- `deploy/nginx/default.conf`
- deployed static bundle at `deploy/admin-web`
- SSL certificates from `/etc/letsencrypt`
- recent DB backup files from `docker/backups`

This is the minimum needed to restore the app on a new VM quickly.

### 4. Assets

Back up uploaded/static content that is hard to recreate:

- `server/blog-images`
- `server/toolkit-files`
- any source paper folders you care about
- any validated review bundles you want to preserve

## Fastest Migration Strategy If The VPS Dies

1. Provision a fresh Ubuntu VPS.
2. Install Docker and Docker Compose.
3. Restore:
   - repo code from git
   - `server.env`
   - `docker-compose.yml`
   - `deploy/nginx/default.conf`
   - `deploy/admin-web`
   - uploaded assets
   - `/etc/letsencrypt`
4. Start only Postgres first.
5. Restore the Postgres dump.
6. Start API and nginx.
7. Verify:
   - `/`
   - `/portal/`
   - `/admin/`
   - `/marketing-admin/`
   - `/api/v1/bootstrap`

## Restore Order

### Database

Restore DB after Postgres is up:

```bash
gunzip -c merit_launchers.sql.gz | docker exec -i merit-launchers-postgres psql -U merit -d merit_launchers
```

### Static bundle

Restore the production web bundle to:

```text
/root/merit-launchers/deploy/admin-web
```

### SSL certificates

Restore:

```text
/etc/letsencrypt
```

Permissions matter. After restoring, nginx must be able to read the mounted cert files.

## Production Facts Currently Observed

- Live app directory on VPS has been observed at:
  - `/root/merit-launchers`
- Docker containers:
  - `merit-launchers-postgres`
  - `merit-launchers-api`
  - `merit-launchers-nginx`
  - `merit-launchers-postgres-backup`

Treat these as current-known values, but recheck before a disaster recovery run.

## Operational Recommendation

Use both:

1. git for code
2. encrypted external-drive backups for secrets + production state
3. regular Postgres dumps

That combination gives the cleanest recovery path.
