"""
회원가입, 로그인, 중복 확인 등 인증 관련 API.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserInterest
from app.schemas.user import (
    DuplicateCheckResponse,
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserProfileResponse,
)

router = APIRouter(prefix="/api/auth", tags=["인증"])


@router.get("/check-username", response_model=DuplicateCheckResponse, summary="아이디 중복 확인")
def check_username(username: str, db: Session = Depends(get_db)):
    exists = db.scalar(select(User).where(User.username == username)) is not None
    return DuplicateCheckResponse(available=not exists)


@router.get("/check-email", response_model=DuplicateCheckResponse, summary="이메일 중복 확인")
def check_email(email: str, db: Session = Depends(get_db)):
    exists = db.scalar(select(User).where(User.email == email)) is not None
    return DuplicateCheckResponse(available=not exists)


@router.get("/check-skala-id", response_model=DuplicateCheckResponse, summary="SKALA 고유번호 중복 확인")
def check_skala_id(skala_id: str, db: Session = Depends(get_db)):
    exists = db.scalar(select(User).where(User.skala_id == skala_id)) is not None
    return DuplicateCheckResponse(available=not exists)


@router.post(
    "/signup",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입",
)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    # 중복 확인 (아이디 / 이메일 / SKALA 고유번호)
    if db.scalar(select(User).where(User.username == payload.username)) is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 사용 중인 아이디입니다.")
    if db.scalar(select(User).where(User.email == payload.email)) is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 사용 중인 이메일입니다.")
    if db.scalar(select(User).where(User.skala_id == payload.skala_id)) is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 등록된 SKALA 고유번호입니다.")

    user = User(
        name=payload.name,
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        skala_id=payload.skala_id,
        campus=payload.campus.value,
    )
    db.add(user)
    db.flush()  # user.id를 확보하기 위해 flush

    for interest in payload.interests:
        db.add(UserInterest(user_id=user.id, interest=interest.value))

    db.commit()
    db.refresh(user)

    return UserProfileResponse(
        id=user.id,
        name=user.name,
        username=user.username,
        email=user.email,
        skala_id=user.skala_id,
        campus=user.campus,
        campus_label=user.campus_label,
        is_admin=user.is_admin,
        interests=[i.interest for i in user.interests],
        joined_study_count=0,
        points=user.points,
        created_at=user.created_at,
    )


@router.post("/login", response_model=TokenResponse, summary="로그인 (JWT 발급)")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == payload.username))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "아이디 또는 비밀번호가 올바르지 않습니다.",
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}, remember_me=payload.remember_me
    )
    return TokenResponse(access_token=access_token)


@router.post("/logout", summary="로그아웃")
def logout(current_user: User = Depends(get_current_user)):
    # JWT는 서버 상태를 가지지 않으므로, 로그아웃은 클라이언트가 토큰을 삭제하는 방식으로 처리한다.
    # (필요 시 블랙리스트 테이블을 추가하여 서버 측 무효화를 구현할 수 있다.)
    return {"message": "로그아웃되었습니다."}
