from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .config import Settings, get_settings

# TODO: در فاز بعد Pool/async تنظیم می‌شود؛ فعلاً اسکلت sync است.


def get_engine(settings: Settings | None = None):
    settings = settings or get_settings()
    if not settings.database_url:
        raise ValueError("DATABASE_URL is not configured")  # مقداردهی در .env فراموش نشود.
    return create_engine(settings.database_url, pool_pre_ping=True)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
