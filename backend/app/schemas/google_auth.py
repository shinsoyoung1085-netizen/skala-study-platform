"""
Google 로그인 관련 요청/응답 스키마.
"""
from pydantic import BaseModel, Field

from app.models.enums import Campus, CategoryCode


class GoogleLoginRequest(BaseModel):
    """프론트엔드(Google Identity Services)에서 발급받은 ID 토큰."""

    id_token: str = Field(..., description="Google Identity Services가 발급한 ID 토큰")


class GoogleLoginResponse(BaseModel):
    """
    기존 회원이면 바로 access_token이 채워지고, 처음 보는 구글 계정이면
    needs_profile_completion=True와 함께 pending_token/프로필 미리보기가 내려간다.
    """

    needs_profile_completion: bool
    access_token: str | None = None
    pending_token: str | None = None
    email: str | None = None
    name: str | None = None
    picture: str | None = None


class GoogleCompleteSignupRequest(BaseModel):
    """구글 최초 로그인 후 SKALA 고유번호/캠퍼스를 마저 입력해 가입을 완료하는 요청."""

    pending_token: str = Field(..., description="/api/auth/google 응답으로 받은 pending_token")
    skala_id: str = Field(..., min_length=1, max_length=50, description="SKALA 고유번호")
    campus: Campus = Field(..., description="소속 캠퍼스")
    interests: list[CategoryCode] = Field(default_factory=list, description="관심분야 (복수 선택)")
