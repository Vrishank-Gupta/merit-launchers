# Merit Launchers

Merit Launchers is a multi-surface education platform with:
- a public marketing website
- a student portal and mobile app
- an admin CMS for courses, subjects, papers, questions, blogs, and support
- a marketing admin console
- a partner portal
- a Node.js API with PostgreSQL

## Portal Surfaces

- Marketing site: `/`
- Student portal: `/portal/`
- Admin CMS: `/admin/`
- Marketing admin: `/marketing-admin/`
- Partner portal: `/partner/`
- API: `/api/`

## Core Stack

- Flutter for student and admin web/mobile surfaces
- React + Vite for the marketing site and partner/marketing console
- Node.js API in `server/`
- PostgreSQL via Docker Compose
- Nginx for static hosting and reverse proxy

## Local Development

From the repo root:

```powershell
cd C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers
docker compose up -d --build postgres api
```

Run the Flutter web surfaces:

```powershell
flutter run -d chrome --web-port 3000
```

Useful local URLs:
- Student portal: `http://localhost:3000/portal`
- Admin CMS: `http://localhost:3000/admin`

Run the marketing site:

```powershell
cd marketing
npm install
npm run dev
```

Useful local marketing URLs:
- Marketing site: `http://localhost:5173/`
- Marketing admin: `http://localhost:5173/marketing-admin/login`
- Partner login: `http://localhost:5173/partner/login`

## Production Deployment

Production uses:
- `docker-compose.yml`
- `deploy/nginx/default.conf`
- static bundles assembled into `deploy/admin-web`

Build the production static surfaces locally before syncing to a server:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\build-admin-web.ps1
```

That generates:
- marketing site bundle at `deploy/admin-web/`
- student portal bundle at `deploy/admin-web/portal/`
- admin bundle at `deploy/admin-web/admin/`
- marketing console bundle at `deploy/admin-web/marketing/`

## CUET Import Notes

The CUET import now supports:
- `course -> subject -> paper -> question`
- 21 CUET subjects
- 211 CUET papers
- 9767 imported questions

Final CUET reports:
- `docs/cuet_final_import_summary.md`
- `docs/cuet_final_import_summary.json`
- `docs/cuet_skipped_questions.json`

Recovery tooling kept in-repo:
- `scripts/import_cuet_bundle.js`
- `scripts/recover_cuet_skipped_with_ocr.py`
- `scripts/generate_cuet_import_summary.py`
- `server/scripts/recover_cuet_skipped_with_gemini.mjs`

## Important Repo Conventions

- `deploy/admin-web/` is generated locally and intentionally ignored by git
- `deploy/portal-build/` is a disposable local build artifact and ignored
- OCR scratch images are disposable and ignored
- reports and OCR text caches that help future recovery are kept

## Credentials and Secrets

- Local and production secrets live in `server.env`
- `server.env` is intentionally ignored by git
- Do not commit live passwords, API keys, or certificates into the repository

## Useful Directories

- `lib/` - Flutter app and admin/student UI
- `marketing/` - public site and partner/marketing console
- `server/src/` - Node API
- `server/sql/` - schema and seed scripts
- `deploy/` - Nginx config and bundle assembly
- `docs/` - import reports and internal manuals
- `scripts/` - one-off utilities that are still useful
