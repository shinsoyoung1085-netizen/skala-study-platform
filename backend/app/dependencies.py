"""
라우터에서 공통으로 사용하는 FastAPI 의존성(Dependency) 함수 모음.
- DB 세션 주입
- 로그인한 사용자 인증
- 관리자 권한 검증
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import User

# 토큰 발급 엔드포인트 경로 (Swagger UI의 Authorize 버튼에서 사용)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Authorization 헤더의 Bearer 토큰을 검증하여 현재 로그인한 회원을 반환한다."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다. 다시 로그인해주세요.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise credentials_exception

    user_id = int(payload["sub"])
    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """관리자 권한이 필요한 엔드포인트에서 사용하는 의존성."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자만 접근할 수 있습니다.",
        )
    return current_user
