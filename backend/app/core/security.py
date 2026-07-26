"""
비밀번호 암호화 및 JWT 토큰 생성/검증을 담당하는 모듈.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """평문 비밀번호를 bcrypt로 암호화한다."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """평문 비밀번호와 암호화된 비밀번호가 일치하는지 확인한다."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict[str, Any], remember_me: bool = False) -> str:
    """
    JWT 액세스 토큰을 생성한다.
    remember_me가 True면 "로그인 유지"를 위해 만료 시간을 길게 설정한다.
    """
    to_encode = data.copy()
    expire_minutes = (
        settings.ACCESS_TOKEN_REMEMBER_EXPIRE_MINUTES
        if remember_me
        else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """JWT 토큰을 검증하고 payload를 반환한다. 유효하지 않으면 None을 반환한다."""
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
