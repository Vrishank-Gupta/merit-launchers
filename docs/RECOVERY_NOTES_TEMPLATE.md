# Recovery Notes Template

Fill and keep this file both in your password manager notes and on the external drive.

## Ownership

- Domain registrar:
- DNS provider:
- AWS account owner:
- Google Play Console owner:
- Google Cloud / Firebase owner:
- Razorpay owner:
- SES sender identity owner:

## VPS

- Provider:
- Region:
- Public IP:
- SSH username:
- SSH auth method:
- Repo/app path on server:
- Docker installed:
- Docker Compose installed:

## Production App Structure

- Marketing site route:
- Student portal route:
- Admin CMS route:
- Marketing admin route:
- Partner portal route:
- API route:

## Production Files To Restore

- `server.env`
- `docker-compose.yml`
- `deploy/nginx/default.conf`
- `deploy/admin-web`
- `server/blog-images`
- `server/toolkit-files`
- `/etc/letsencrypt`
- latest Postgres dump

## Database

- Container name:
- DB name:
- DB user:
- Restore command tested:

## Android Release

- Upload keystore path:
- key alias:
- where key password is stored:
- Play Console app signing notes:

## Deployment

- Local deploy machine:
- SSH alias used:
- Actual VPS app path:
- Build command:
- Deploy command:
- nginx reload command:

## Verification Checklist

- Homepage opens
- Student portal opens
- Admin opens
- Marketing admin opens
- `/api/v1/bootstrap` returns JSON
- Login works
- Payments config correct
- Google login config correct
