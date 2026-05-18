# Merit Launchers VPS Codex Instructions

This workspace is the stable remote development copy for phone-driven work.

## Paths
- Stable workspace: `/root/codex-workspaces/merit-launchers-main`
- Experimental workspace: `/root/codex-workspaces/merit-launchers-dev`
- Live production app: `/root/merit-launchers`

## Safety rules
- Never edit `/root/merit-launchers` directly for feature work.
- Make code changes in `/root/codex-workspaces/merit-launchers-main` unless explicitly told otherwise.
- Before any deploy, summarize whether the change is runtime-only or full frontend+runtime.
- Prefer runtime-only deploys when frontend is untouched.
- If a deploy causes issues, use rollback immediately.

## Production commands
- Inspect status: `merit-phone status`
- Update workspace from GitHub: `merit-phone update`
- Publish phone/VPS changes back to GitHub `main`: `merit-phone publish "commit message"`
- Deploy runtime-only: `merit-phone deploy runtime --skip-qa`
- Deploy full frontend+runtime: `merit-phone deploy full --skip-qa`
- Deploy marketing root only: `merit-phone deploy marketing --skip-qa`
- Roll back latest release: `merit-phone rollback latest`
- Show current release state: `merit-phone release-state`
- Print the VPS GitHub public key: `merit-phone github-key`

## Expected behavior
- If the user says "deploy it", determine the correct deploy mode from the files changed and ask for confirmation only when there is real risk or when frontend is included.
- If the user wants the work to be resumable later on desktop, commit and push the intended code to GitHub `main` first with `merit-phone publish "commit message"`.
- If the user says "rollback", default to `merit-phone rollback latest` unless they specify a release id.