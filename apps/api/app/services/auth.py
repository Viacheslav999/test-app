from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd.verify(password, password_hash)


def create_access_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_minutes)
    payload = {"sub": str(user_id), "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return int(payload["sub"])
    except Exception:
        return None
