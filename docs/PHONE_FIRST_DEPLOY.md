# Phone-First Deploy Flow

This document describes the cleanest production workflow for `merit_launchers` when you want to work from Codex/ChatGPT on mobile and not depend on the laptop being online.

## Goal

- Codex can develop against the repo in GitHub
- merging to `main` deploys production automatically
- production rollback can be run from a GitHub workflow without touching the laptop

## Recommended setup

1. Keep the repo in GitHub as the source of truth.
2. Use Codex cloud against the GitHub repo.
3. Let GitHub Actions build and stage the release.
4. Let the VPS run the final apply and smoke checks.
5. Keep rollback state and backups on the VPS.

## What was added

- GitHub deploy workflow: `.github/workflows/production-deploy.yml`
- GitHub rollback workflow: `.github/workflows/production-rollback.yml`
- GitHub ChatOps workflow: `.github/workflows/production-chatops.yml`
- Linux regression gate: `deploy/run-local-regression.sh`
- Linux staging script: `deploy/stage-vps-release.sh`
- VPS rollback command: `deploy/vps-rollback-release.sh`
- release-state tracking in `deploy/vps-deploy-release.sh`
- secret helper scripts: `deploy/print-github-prod-secrets.ps1` and `deploy/print-github-prod-secrets.sh`

## Normal mobile workflow

1. Ask Codex from ChatGPT mobile to make the change in the GitHub repo.
2. Have Codex open a PR or update an existing branch.
3. Merge to `main`.
4. `Production Deploy` runs automatically.
5. The workflow stages a release tarball, uploads it to the VPS, applies it with `vps-deploy-release.sh`, and runs the server smoke suite.

## Rollback workflow

If the latest production release is bad:

1. Open the `Production Rollback` workflow.
2. Leave `release_id` blank to roll back the current release, or provide a specific release id.
3. Run the workflow.
4. The workflow calls `deploy/vps-rollback-release.sh` on the VPS.
5. The VPS restores the previous backup, restarts services as needed, and runs post-rollback smoke.

## ChatOps commands

If you want command-style operations from GitHub comments, the `Production ChatOps` workflow supports:

- `/redeploy`
- `/rollback`
- `/rollback latest`
- `/rollback <release-id>`

Only repository owner/member/collaborator comments are accepted.

## GitHub secrets required

Add these repository or environment secrets before using the workflows:

- `PROD_SSH_PRIVATE_KEY`
- `PROD_SSH_TARGET`
- `PROD_SSH_KNOWN_HOSTS`

Recommended values:

- `PROD_SSH_TARGET`: `root@87.232.72.72`
- `PROD_SSH_KNOWN_HOSTS`: output of `ssh-keyscan -H 87.232.72.72`

From this machine, you can print the exact values with:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\print-github-prod-secrets.ps1
```

## Important limitation

ChatGPT mobile + Codex can work cleanly for code changes once the repo is in GitHub, and deploy-on-merge removes the laptop dependency.

Rollback is implemented here both as a GitHub workflow and as a GitHub comment-driven ChatOps command. The missing non-repo step is still adding the GitHub secrets once.
