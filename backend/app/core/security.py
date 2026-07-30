"""
비밀번호 암호화 및 JWT 토큰 생성/검증을 담당하는 모듈.
"""
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 관리자가 회원 비밀번호를 재설정할 때 발급하는 임시 비밀번호 길이.
TEMPORARY_PASSWORD_LENGTH = 10


def hash_password(plain_password: str) -> str:
    """평문 비밀번호를 bcrypt로 암호화한다."""
    return pwd_context.hash(plain_password)


def generate_temporary_password() -> str:
    """[관리자] 비밀번호 재설정 시 발급할 임시 비밀번호를 무작위로 생성한다."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(TEMPORARY_PASSWORD_LENGTH))


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


def create_google_pending_signup_token(profile: dict[str, Any]) -> str:
    """
    Google로 처음 로그인한 신규 회원이 SKALA 고유번호/캠퍼스를 입력하는 동안
    구글 프로필 정보를 임시로 담아두는 단기 토큰. 일반 로그인 세션 토큰과
    절대 혼동되지 않도록 "sub" 클레임을 넣지 않는다 (get_current_user는 sub가 없으면 무조건 거부한다).
    """
    to_encode: dict[str, Any] = {
        "purpose": "google_pending_signup",
        "profile": profile,
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=settings.GOOGLE_PENDING_SIGNUP_EXPIRE_MINUTES),
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_google_pending_signup_token(token: str) -> dict[str, Any] | None:
    """pending signup 토큰을 검증하고 구글 프로필 정보를 반환한다. 유효하지 않으면 None."""
    payload = decode_access_token(token)
    if payload is None or payload.get("purpose") != "google_pending_signup":
        return None
    return payload.get("profile")
