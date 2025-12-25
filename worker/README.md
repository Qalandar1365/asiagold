# Cloudflare Worker (edge auth)

Responsibilities (future phases):
- Validate Telegram `initData` and user identity (HMAC-SHA256 with bot token).
- Issue short-lived session tokens for the backend (HMAC با `SESSION_TOKEN_SECRET`).
- Reject any request without valid signature and freshness checks.
- Forward only minimal, trusted context to the backend.

Env/config placeholders will be wired in later phases.

Env vars (لزومی):
- `TELEGRAM_BOT_TOKEN` – توکن ربات تلگرام برای بررسی امضای initData.
- `SESSION_TOKEN_SECRET` – راز مشترک با بک‌اند برای امضای توکن جلسه.
- `SESSION_TOKEN_TTL_MINUTES` – مدت اعتبار توکن جلسه (پیش‌فرض ۱۵).
