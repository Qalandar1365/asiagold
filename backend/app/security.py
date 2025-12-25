import base64
import json
import time
import hmac
import hashlib
import secrets

from fastapi import HTTPException, status

from .config import Settings


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def decode_session_token(token: str, settings: Settings) -> dict:
    if settings.session_token_secret == "...":
        # TODO: مقدار SESSION_TOKEN_SECRET را در محیط ست کنید.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="server secret not configured",
        )

    try:
        payload_part, signature_part = token.split(".", 1)
    except ValueError:
        raise HTTPException(status_code=401, detail="invalid token format")

    try:
        payload_bytes = _b64url_decode(payload_part)
        payload = json.loads(payload_bytes)
    except Exception:
        raise HTTPException(status_code=401, detail="invalid token payload")

    try:
        provided_sig = _b64url_decode(signature_part)
    except Exception:
        raise HTTPException(status_code=401, detail="invalid token signature")

    expected_sig = hmac.new(
        settings.session_token_secret.encode("utf-8"),
        payload_part.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    if not secrets.compare_digest(provided_sig, expected_sig):
        raise HTTPException(status_code=401, detail="signature mismatch")

    exp = payload.get("exp")
    if not isinstance(exp, (int, float)):
        raise HTTPException(status_code=401, detail="exp missing")

    now = int(time.time())
    if exp < now:
        raise HTTPException(status_code=401, detail="token expired")

    return payload
