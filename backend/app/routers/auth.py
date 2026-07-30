"""
회원가입, 로그인, 중복 확인, Google 소셜 로그인 등 인증 관련 API.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.google_oauth import InvalidGoogleTokenError, verify_google_id_token
from app.core.security import (
    create_access_token,
    create_google_pending_signup_token,
    decode_google_pending_signup_token,
    generate_temporary_password,
    hash_password,
    verify_password,
)
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserInterest
from app.schemas.google_auth import (
    GoogleCompleteSignupRequest,
    GoogleLoginRequest,
    GoogleLoginResponse,
)
from app.schemas.user import (
    DuplicateCheckResponse,
    FindPasswordRequest,
    FindPasswordResponse,
    FindUsernameRequest,
    FindUsernameResponse,
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserProfileResponse,
)

router = APIRouter(prefix="/api/auth", tags=["인증"])


def _to_profile_response(user: User, joined_study_count: int = 0) -> UserProfileResponse:
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        username=user.username,
        email=user.email,
        skala_id=user.skala_id,
        campus=user.campus,
        campus_label=user.campus_label,
        is_admin=user.is_admin,
        is_main_admin=user.is_main_admin,
        interests=[i.interest for i in user.interests],
        joined_study_count=joined_study_count,
        points=user.points,
        picture_url=user.picture_url,
        has_password=user.hashed_password is not None,
        created_at=user.created_at,
    )


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

    return _to_profile_response(user)


@router.post("/login", response_model=TokenResponse, summary="로그인 (JWT 발급)")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == payload.username))

    if user is None or user.hashed_password is None:
        # user.hashed_password가 None이면 Google 전용 계정 — 비밀번호 로그인을 아예 시도하지 않는다.
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "아이디 또는 비밀번호가 올바르지 않습니다.",
        )
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "아이디 또는 비밀번호가 올바르지 않습니다.",
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}, remember_me=payload.remember_me
    )
    return TokenResponse(access_token=access_token)


@router.post("/find-username", response_model=FindUsernameResponse, summary="아이디 찾기")
def find_username(payload: FindUsernameRequest, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User).where(
            User.name == payload.name,
            User.skala_id == payload.skala_id,
            User.email == payload.email,
        )
    )
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "일치하는 회원 정보를 찾을 수 없습니다.")
    return FindUsernameResponse(username=user.username)


@router.post("/find-password", response_model=FindPasswordResponse, summary="비밀번호 찾기 (임시 비밀번호 발급)")
def find_password(payload: FindPasswordRequest, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User).where(
            User.username == payload.username,
            User.name == payload.name,
            User.skala_id == payload.skala_id,
            User.email == payload.email,
        )
    )
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "일치하는 회원 정보를 찾을 수 없습니다.")

    temporary_password = generate_temporary_password()
    user.hashed_password = hash_password(temporary_password)
    db.commit()
    return FindPasswordResponse(temporary_password=temporary_password)


@router.post("/logout", summary="로그아웃")
def logout(current_user: User = Depends(get_current_user)):
    # JWT는 서버 상태를 가지지 않으므로, 로그아웃은 클라이언트가 토큰을 삭제하는 방식으로 처리한다.
    # (필요 시 블랙리스트 테이블을 추가하여 서버 측 무효화를 구현할 수 있다.)
    return {"message": "로그아웃되었습니다."}


@router.post("/google", response_model=GoogleLoginResponse, summary="Google 로그인/가입")
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        profile = verify_google_id_token(payload.id_token)
    except InvalidGoogleTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "구글 로그인 검증에 실패했습니다.")

    # 1) 이미 구글로 연동된 계정이면 바로 로그인
    user = db.scalar(select(User).where(User.google_id == profile.google_id))

    # 2) 같은 이메일로 가입된 (비밀번호) 계정이 있으면 구글 계정을 연동해서 로그인
    if user is None:
        user = db.scalar(select(User).where(User.email == profile.email))
        if user is not None:
            user.google_id = profile.google_id
            if not user.picture_url:
                user.picture_url = profile.picture
            db.commit()

    if user is not None:
        access_token = create_access_token(data={"sub": str(user.id)}, remember_me=True)
        return GoogleLoginResponse(needs_profile_completion=False, access_token=access_token)

    # 3) 처음 보는 구글 계정 — SKALA 고유번호/캠퍼스를 마저 입력해야 가입이 완료된다.
    pending_token = create_google_pending_signup_token(
        {
            "google_id": profile.google_id,
            "email": profile.email,
            "name": profile.name,
            "picture": profile.picture,
        }
    )
    return GoogleLoginResponse(
        needs_profile_completion=True,
        pending_token=pending_token,
        email=profile.email,
        name=profile.name,
        picture=profile.picture,
    )


@router.post(
    "/google/complete-signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Google 최초 로그인 후 SKALA 고유번호/캠퍼스 입력으로 가입 완료",
)
def google_complete_signup(payload: GoogleCompleteSignupRequest, db: Session = Depends(get_db)):
    profile = decode_google_pending_signup_token(payload.pending_token)
    if profile is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "인증 정보가 만료되었습니다. Google 로그인을 다시 시도해주세요."
        )

    # 그 사이에 이미 가입되었을 수 있으니 다시 한번 확인한다.
    if db.scalar(select(User).where(User.google_id == profile["google_id"])) is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 가입된 구글 계정입니다.")
    if db.scalar(select(User).where(User.email == profile["email"])) is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 사용 중인 이메일입니다.")
    if db.scalar(select(User).where(User.skala_id == payload.skala_id)) is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 등록된 SKALA 고유번호입니다.")

    # 아이디는 이메일 앞부분을 기본값으로 사용하고, 이미 있으면 숫자를 붙여 중복을 피한다.
    base_username = profile["email"].split("@")[0][:45] or "user"
    username = base_username
    suffix = 1
    while db.scalar(select(User).where(User.username == username)) is not None:
        suffix += 1
        username = f"{base_username}{suffix}"

    user = User(
        name=profile["name"],
        username=username,
        email=profile["email"],
        hashed_password=None,
        google_id=profile["google_id"],
        picture_url=profile.get("picture"),
        skala_id=payload.skala_id,
        campus=payload.campus.value,
    )
    db.add(user)
    db.flush()

    for interest in payload.interests:
        db.add(UserInterest(user_id=user.id, interest=interest.value))

    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)}, remember_me=True)
    return TokenResponse(access_token=access_token)
