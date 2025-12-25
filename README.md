# AsiaGold Telegram Mini App (TMA)

Phase 1 scaffold for the secure order management system.

## Architecture (fixed)
- Telegram Mini App → Cloudflare Pages (UI) → Cloudflare Worker (initData verification) → FastAPI backend on GCP VM → PostgreSQL.
- UI data is untrusted; Worker issues short-lived session tokens; all business logic stays in the Python backend.

## Folder structure
- `ui/` – Cloudflare Pages frontend (TMA container).
- `worker/` – Cloudflare Worker for initData verification and token issuance (to be implemented in a later phase).
- `backend/` – FastAPI backend.
  - `app/` – backend application package.
  - `.venv/` – Python virtual environment (local-only, ignored by git).
- `infra/` – infra/docs placeholders (future phases).

## Python virtual environment
The backend virtual environment is created at `backend/.venv`.
- Activate on Windows PowerShell: `.\backend\.venv\Scripts\Activate.ps1`
- Activate on Windows cmd: `.\backend\.venv\Scripts\activate.bat`
- Activate on macOS/Linux (if used): `source backend/.venv/bin/activate`
- Upgrade pip once activated: `python -m pip install --upgrade pip`

## Git
Repository is already initialized. After configuring user info, verify status with `git status`.

## GitHub connection (when ready)
1) Create a GitHub repo (empty, no README/license/gitignore).
2) Add remote: `git remote add origin https://github.com/<your-org>/<repo>.git`
3) Push: `git push -u origin main` (or `master` depending on your branch).
