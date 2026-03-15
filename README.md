# Merit Launchers

VM-first architecture for:
- public marketing website at `/`
- student portal at `/portal`
- admin dashboard at `/admin`
- self-hosted Node API at `/api`
- PostgreSQL with persistent storage and rolling backups

The active backend path is your own Ubuntu VM, not a managed BaaS.

## What this repo contains

- Flutter student app and admin web UI in [lib](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/lib)
- self-hosted Node.js API in [server/src/index.js](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/server/src/index.js)
- PostgreSQL bootstrap schema in [server/sql/init.sql](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/server/sql/init.sql)
- Docker Compose stack in [docker-compose.yml](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/docker-compose.yml)
- Nginx reverse proxy in [deploy/nginx/default.conf](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/deploy/nginx/default.conf)
- marketing site mirror in [deploy/marketing-site](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/deploy/marketing-site)
- Gemini-based paper import with trace logs in [server/import-logs](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/server/import-logs)
- TeX rendering for admin and student question views through [rich_math_content.dart](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/lib/widgets/rich_math_content.dart)

## Production URLs

Recommended single-domain production shape:
- `https://meritlaunchers.com/` -> public website
- `https://meritlaunchers.com/portal/` -> student portal
- `https://meritlaunchers.com/admin/` -> admin portal
- `https://meritlaunchers.com/api/` -> backend API

This repo is already aligned to that route-based setup behind one Nginx server.

## Current app status

The Flutter app now supports:
- `demo` mode
- `VM API-backed` mode for:
  - Google login
  - OTP request/verify through your server
  - admin content reads/writes
  - Razorpay order creation and verification
  - Gemini-first paper import for `.docx` and `.txt`
  - TeX rendering for mixed text + inline/display math in admin and student views
  - resumable tests across app and website
  - topic/concept analytics after each test and across multiple attempts

## Math and paper-import pipeline

Current question-paper flow:
1. Admin uploads `.docx` or `.txt`
2. Backend extracts the source text/document structure
3. Gemini parses the paper into structured JSON
4. Admin review/edit screen loads the parsed questions
5. Student app reads the saved question text and renders math through TeX

Required server env values for AI import:
- `GEMINI_API_KEY`
- `GEMINI_IMPORT_MODEL=gemini-2.5-flash-lite`
- `LLM_IMPORT_DEBUG=true` for trace logging during testing

Debug traces for each import are written to:
- [server/import-logs](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/server/import-logs)

Important:
- `deploy/admin-web` is a generated local build folder and is not committed
- imported paper traces are local debug artifacts and are not committed

## Recommended production shape

- `Nginx`
  - reverse proxy
  - static hosting for public website, student portal, and admin portal
- `Node.js API`
  - auth
  - admin content management
  - Razorpay order creation and verification
- `PostgreSQL`
  - primary database
  - persistent host-mounted storage
  - rolling SQL backups through the `postgres-backup` container
- `Flutter`
  - Android and iOS student app
  - web student and admin portals

## Why this fits your VM

Your VM resources are enough for the MVP:
- `8 GB RAM`
- `50 GB storage`

That is enough for:
- API
- PostgreSQL
- public website hosting
- portal and admin hosting
- receipts/PDFs
- question images/imports
- low-volume file assets

Storage will become the first constraint only if you host a large video library on the same machine.

## Docker deployment on Ubuntu VM

### 1. Install Docker

Use the bootstrap script:

```bash
git clone https://github.com/Vrishank-Gupta/merit-launchers.git
cd merit-launchers
chmod +x deploy/setup-ubuntu.sh
./deploy/setup-ubuntu.sh
```

Reconnect to the VM once if Docker was newly installed.

### 2. Prepare environment

```bash
cp server.env.example server.env
nano server.env
```

Fill at least:
- DB credentials
- JWT secret
- Gemini API key
- Google client IDs
- Razorpay keys
- `APP_ORIGIN`

### 3. Build the web surfaces

On the machine where Flutter is installed:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\build-admin-web.ps1
```

This builds and assembles:
- public website at `/`
- student portal at `/portal/`
- admin portal at `/admin/`

The generated bundle lands in:
- [deploy/admin-web](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/deploy/admin-web)

### 4. Start the full stack

```bash
docker compose up -d --build
```

This starts:
- `postgres`
- `api`
- `nginx`
- `postgres-backup`

### 5. Verify

```bash
docker compose ps
curl http://localhost/health
curl http://localhost/api/v1/bootstrap
```

### 6. Point GoDaddy domain

Point your A record to the VM IP, then enable HTTPS with Let's Encrypt on the VM or through your reverse-proxy setup.

## Persistence and backups

PostgreSQL persistence:
- DB data lives in [docker/postgres-data](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/docker/postgres-data)
- rebuilding containers does not wipe the database

Automatic backups:
- the `postgres-backup` service writes compressed dumps to `docker/backups`
- controlled by:
  - `BACKUP_INTERVAL_HOURS`
  - `BACKUP_RETENTION_DAYS`

Default behavior:
- backup every `24` hours
- keep `14` days of dumps

## Low-network deployment posture

Because your VM provider charges mainly for network traffic, this repo is aligned around low egress:

- keep `videos simple`
  - host them on your Ubuntu VM behind your own HTTPS domain
  - paste the final playback URL into admin
- keep the app `local-first`
  - attempts
  - receipts
  - support history
- keep sync `event-based`, not polling-based
- compress API responses at the server
- cache admin web static assets aggressively through Nginx

What should stay on the VM:
- API
- PostgreSQL
- admin dashboard hosting
- question banks
- receipts/PDFs
- images and small assets

What should not be served from the VM by default:
- raw oversized assets without compression or caching

## Backend endpoints

The VM API in [server/src/index.js](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/server/src/index.js) includes:

- `GET /health`
- `GET /v1/bootstrap`
- `POST /v1/auth/google`
- `POST /v1/auth/otp/request`
- `POST /v1/auth/otp/verify`
- `PUT /v1/me/profile`
- `POST /v1/admin/affiliates`
- `POST /v1/admin/courses`
- `PUT /v1/admin/courses/:courseId/video`
- `POST /v1/admin/papers`
- `POST /v1/attempts`
- `POST /v1/exam-sessions`
- `DELETE /v1/exam-sessions/:sessionId`
- `POST /v1/support-messages`
- `POST /v1/payments/razorpay/order`
- `POST /v1/payments/razorpay/verify`

## Database model

The PostgreSQL schema includes:
- `users`
- `admin_allowlist`
- `affiliates`
- `courses`
- `papers`
- `questions`
- `purchases`
- `attempts`
- `exam_sessions`
- `support_messages`

See [server/sql/init.sql](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/server/sql/init.sql).

## Authentication model

### Google login

Google should be the primary login path.

Flow:
1. Flutter gets Google ID token.
2. App sends token to `POST /v1/auth/google`.
3. Backend verifies token with Google.
4. Backend creates or updates the local user.
5. Backend returns a JWT session token.

### OTP login

OTP is intentionally secondary.

Current server behavior:
- `OTP_PROVIDER=mock` is supported for low-friction testing
- real SMS delivery is not hardcoded yet

That means:
- Google login should be your default production path
- OTP can be enabled later with a vendor like MSG91, Twilio, or 2Factor

## Video hosting

Recommended video path:
- store course video files on your Ubuntu VM
- serve them behind your own domain such as `https://media.meritlaunchers.com/...`
- paste the final HTTPS playback URL into admin
- keep filenames stable so the app can keep using the saved URL without code changes

## Local testing

Start local API + nginx:

```powershell
cd C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers
docker compose up -d --build api nginx
```

Build the local shared web bundle that nginx serves:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\build-admin-web.ps1
```

Then open:

```text
http://localhost/        public website
http://localhost/portal  student portal
http://localhost/admin   admin portal
```

If localhost shows stale UI:
1. hard refresh with `Ctrl + F5`
2. unregister service workers
3. clear site data for `localhost`

## Razorpay

Razorpay runs entirely through the backend.

Required server env values:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

The server already includes:
- order creation
- signature verification
- purchase persistence

## Environment files

### Server env

Copy [server.env.example](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/server.env.example) to `server.env`.

Minimum values:

```env
NODE_ENV=production
PORT=8080
APP_ORIGIN=https://meritlaunchers.com,https://www.meritlaunchers.com,http://localhost,http://127.0.0.1
POSTGRES_DB=merit_launchers
POSTGRES_USER=merit
POSTGRES_PASSWORD=strong_password
DATABASE_URL=postgres://merit:strong_password@postgres:5432/merit_launchers
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
BACKUP_DIR=/backups
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_DAYS=14
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=14d
GOOGLE_CLIENT_ID_WEB=your-google-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID_ANDROID=your-google-android-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID_IOS=your-google-ios-client-id.apps.googleusercontent.com
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
OTP_PROVIDER=mock
OTP_TEST_CODE=123456
GEMINI_API_KEY=replace-me
GEMINI_IMPORT_MODEL=gemini-2.5-flash-lite
LLM_IMPORT_DEBUG=false
```

### Flutter app env

Fill [.env.dev](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/.env.dev) and [.env.prod](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/.env.prod) with:

```env
API_BASE_URL=https://meritlaunchers.com/api
GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
GOOGLE_ANDROID_SERVER_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id.apps.googleusercontent.com
PAYMENT_MODE=live
```

## VM deployment

### Empty Ubuntu VM quick start

Run this on the fresh VM:

```bash
sudo apt update
sudo apt install -y git
git clone https://github.com/Vrishank-Gupta/merit-launchers.git
cd merit-launchers
chmod +x deploy/setup-ubuntu.sh
./deploy/setup-ubuntu.sh
```

If Docker was installed by the script, disconnect and SSH back in once.

Then from the repo root:

```bash
cp server.env.example server.env
nano server.env
docker compose up --build -d
curl http://localhost/health
```

Expected:

```json
{"status":"ok"}
```

That single `server.env` file is the only server credential file you need to touch on the VM.

### Build web bundle

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\build-admin-web.ps1
```

That builds the shared student/admin web bundle and copies it into `deploy/admin-web`, which is the exact folder Nginx serves locally and on the VM.
The same build serves:
- `/` for the student website
- `/admin` for the admin dashboard

If you build on your local Windows machine and deploy to a separate VM, copy that folder to the VM repo:

```powershell
scp -r .\deploy\admin-web\* youruser@your-vm-ip:~/merit-launchers/deploy/admin-web/
```

On Linux/macOS:

```bash
./deploy/build-admin-web.sh
scp -r ./deploy/admin-web/* youruser@your-vm-ip:~/merit-launchers/deploy/admin-web/
```

Nginx in this repo already enables:
- gzip compression for JSON/static assets
- longer cache headers for JS/CSS/images/fonts
- shorter cache for `index.html`
- single-host deployment where `/` serves the student website, `/admin` serves the admin dashboard, and `/api` proxies the backend

### Domain and HTTPS shape

For an Ubuntu VM with a GoDaddy-managed domain, keep deployment simple:

1. Point your DNS A records to the VM IP:
   - `@` -> VM IP
   - `www` -> VM IP
   - optional `admin` -> VM IP if you later want a dedicated admin subdomain
2. Serve one Flutter web build from Nginx.
3. Let Nginx handle:
   - `https://meritlaunchers.com/` -> student website
   - `https://meritlaunchers.com/admin` -> admin dashboard
   - `https://meritlaunchers.com/api/...` -> backend proxy
4. Keep production Flutter builds pointed at the same HTTPS origin:

```env
API_BASE_URL=https://meritlaunchers.com/api
```

5. Set `APP_ORIGIN` in `server.env` to your production web origins.
6. Enable TLS before switching production Google login and Razorpay live traffic on.

The current codebase already assumes this setup:
- web routing distinguishes `/admin` from the student website
- backend accepts traffic behind Nginx
- production payment mode should be live
- production URLs should be HTTPS only

### Build student app

Android:

```powershell
flutter build apk --release
```

iOS:
- build on a Mac machine or CI runner with Xcode
- before opening Xcode, fill [AppConfig.xcconfig](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/ios/Flutter/AppConfig.xcconfig):
```xcconfig
GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id.apps.googleusercontent.com
GOOGLE_SERVER_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
GOOGLE_REVERSED_CLIENT_ID=com.googleusercontent.apps.your-reversed-client-id
```
- then on the Mac:
```bash
cd ios
pod install
cd ..
flutter build ios --release
```
- local HTTP dev testing is allowed for `localhost` / `127.0.0.1` in [Info.plist](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/ios/Runner/Info.plist); production should still use HTTPS API URLs

## Linux VM checklist

Then:
1. clone this repo
2. run [setup-ubuntu.sh](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/deploy/setup-ubuntu.sh)
3. create `server.env`
4. run `docker compose up --build -d`
5. point your domains to the VM
6. add HTTPS with Let's Encrypt or your GoDaddy-managed certificate
7. set `.env.prod` for the Flutter app build machine
8. set up daily PostgreSQL backups

## Google console setup

Create OAuth clients for:
- web
- Android
- iOS

Use those client IDs in:
- `server.env`
- `.env.dev` / `.env.prod`

For Android, keep adding SHA fingerprints in the relevant Google project configuration if you rely on native Google sign-in packages.

## Admin allowlist

Admins are not open sign-up users.

On a fresh VM boot, the database seed script will automatically insert:
- `ADMIN_ALLOWLIST_EMAIL`
- `ADMIN_ALLOWLIST_PHONE` if provided
- sample affiliates, courses, papers, questions, one demo student, one purchase, one attempt, and a support thread when `SEED_SAMPLE_DATA=true`

Defaults live in [server.env.example](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/server.env.example).

If you want to disable the demo course content on a brand-new production database, set `SEED_SAMPLE_DATA=false` before the first `docker compose up`.

Insert rows into `admin_allowlist` such as:

```sql
insert into admin_allowlist (id, label, email, is_active)
values ('founder@example.com', 'Founder', 'founder@example.com', true);

insert into admin_allowlist (id, label, phone, is_active)
values ('+919876543210', 'Ops admin', '+919876543210', true);
```

## Network cost rules

Keep these rules in place:

1. Do not poll the API repeatedly from the app.
2. Refresh content on:
   - app open
   - manual refresh
   - successful purchase
   - admin publish
3. Cache papers and metadata on-device.
4. Keep video files compressed and served over HTTPS from your VM or media subdomain.
5. Avoid returning large student/admin lists without pagination.
6. Keep PDFs and receipts reused locally once downloaded.

## Manual follow-up still required

You still need to do these manually:

1. fill `server.env`
2. fill `.env.dev` and `.env.prod`
3. decide whether OTP stays mock-only or gets a real SMS vendor
4. deploy to the VM
5. point domains to the VM
6. add TLS/HTTPS
7. add production Google client IDs and Razorpay secrets
8. set `SEED_SAMPLE_DATA=false` before first production boot if you do not want demo content

## Local commands

Flutter demo:

```powershell
flutter pub get
flutter run
```

Admin web:

```powershell
flutter run -d chrome --dart-define=APP_ENV=dev
```

Student mobile:

```powershell
flutter run --dart-define=APP_ENV=dev
```

Server:

```powershell
docker compose up -d --build api nginx
```

## Minimal navigation workflow

Most deployment work now happens from the repo root:

```bash
cd merit-launchers
cp server.env.example server.env
nano server.env
docker compose up --build -d
```

For app builds on your local Windows machine:

```powershell
cd C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers
.\deploy\build-admin-web.ps1
flutter build apk --release --dart-define=APP_ENV=prod
```
