# Backend (FastAPI) scaffold

Structure
- `app/` – application package (main، config، security، models و ماژول‌های بعدی).
- `.venv/` – local virtual environment (not committed).
- `.env.example` – نمونه متغیرهای محیطی با توضیح فارسی برای مقداردهی.
- `requirements.txt` – وابستگی‌های بک‌اند.

Local setup
1) Activate venv (Windows PowerShell): `.\backend\.venv\Scripts\Activate.ps1`
2) Upgrade pip: `python -m pip install --upgrade pip`
3) Install deps: `pip install -r requirements.txt`
4) Run dev server: `uvicorn app.main:app --reload`

Security notes (stay aligned with architecture):
- Treat all UI input as untrusted; trust only Worker-issued session tokens.
- Keep business logic and validation on the backend.
- توکن‌های جلسه توسط ورکر HMAC می‌شوند؛ بک‌اند در `decode_session_token` امضا و exp را بررسی می‌کند (مقدار SESSION_TOKEN_SECRET را ست کنید).
