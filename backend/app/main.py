from fastapi import FastAPI, Depends, Header, HTTPException

from .config import get_settings, Settings
from .security import decode_session_token

app = FastAPI(title="AsiaGold TMA Backend", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/whoami")
def whoami(
    session_token: str | None = Header(default=None, convert_underscores=False),
    settings: Settings = Depends(get_settings),
):
    if not session_token:
        raise HTTPException(status_code=401, detail="missing session token")

    # TODO: احراز هویت توکن جلسه با کلید ورکر را در verify_session_token پیاده‌سازی کنید.
    payload = decode_session_token(session_token, settings)
    return {
        "tg_id": payload.get("tg_id"),
        "first_name": payload.get("first_name"),
        "last_name": payload.get("last_name"),
        "username": payload.get("username"),
        "status": "verified-by-worker",
    }


@app.get("/orders")
def list_orders():
    # TODO: در فازهای بعدی به دیتابیس و منطق سفارش متصل می‌شود.
    return {"items": []}
