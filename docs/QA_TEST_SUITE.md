# Merit Launchers QA Gate

This is the production release gate for the student portal, CMS admin portal, and API.

## Mandatory Local Gate

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\run-qa.ps1
```

This runs:

- Full Flutter test suite with unit, controller workflow, API client, repository contract, and widget tests.
- Focused analyzer check on the high-risk app/API/parser/rendering files.

Current coverage includes:

- API client non-JSON/HTML response handling, so nginx/server HTML errors cannot crash Flutter with a raw `FormatException`.
- Auth entry screens for student and admin portals.
- Student login form validation and admin reset validation.
- Paper add/update workflow with math segments, question images, option images, free preview, and subject filtering.
- Metadata-only paper behavior so `questionCount: 50` with no loaded questions does not get mistaken for a fully loaded paper.
- Math parser normalization for escaped dollars, inline/display delimiters, matrix/cases environments, fractions, roots, powers, Greek letters, sums, integrals, determinants.
- Fallback text formatter behavior for powers/subscripts/basic editor tags.
- API repository contract for source PDF metadata, attachments, option attachments, and question payload persistence.

## Mandatory Deploy Gate

Run deployment through:

```powershell
.\deploy.ps1 -Build -Web
```

The deploy script now runs, in order:

1. `deploy/run-qa.ps1`
2. Git push and VPS pull
3. API restart/rebuild
4. `deploy/run-prod-smoke.ps1`
5. Optional credential-backed `deploy/run-prod-auth-smoke.ps1`
6. Web build and upload when `-Web` is passed
7. nginx permission normalization and reload
8. `deploy/run-prod-web-smoke.ps1`

## Production API Smoke

Run directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\run-prod-smoke.ps1
```

It signs a short-lived admin test token inside the API container, creates a temporary CLAT subject and paper, verifies:

- Bootstrap returns courses.
- Admin subject creation works.
- Admin paper creation persists questions.
- Student/admin paper fetch returns the questions.
- Math segments persist.
- Question image attachments persist.
- Option image attachments persist.
- Paper update persists two questions.
- Temporary data is deleted in `finally`.

## Production Web Smoke

Run directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\run-prod-web-smoke.ps1
```

It verifies:

- Marketing root, FAQ, and contact routes return successfully.
- `/admin/` and `/portal/` serve the correct Flutter base href.
- Admin and portal bootstraps have service-worker cache disabled with `serviceWorkerSettings: null`.
- `/api/v1/bootstrap` returns courses.

## Optional Live Auth Smoke

Run directly:

```powershell
$env:MERIT_QA_ADMIN_EMAIL="admin-test@example.com"
$env:MERIT_QA_ADMIN_PASSWORD="..."
$env:MERIT_QA_STUDENT_EMAIL="student-test@example.com"
$env:MERIT_QA_STUDENT_PASSWORD="..."
powershell -ExecutionPolicy Bypass -File .\deploy\run-prod-auth-smoke.ps1
```

This validates real password-login and authenticated bootstrap for both admin and student users.

Google login is intentionally not automated here until we create dedicated OAuth test users and a stable CI browser environment. Automating real personal Google accounts is brittle and unsafe.
