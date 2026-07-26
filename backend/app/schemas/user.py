"""
회원(User) 관련 요청/응답 스키마.
"""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import CategoryCode


class SignupRequest(BaseModel):
    """회원가입 요청 바디."""

    name: str = Field(..., min_length=1, max_length=50, description="이름")
    username: str = Field(..., min_length=4, max_length=50, description="아이디")
    email: EmailStr = Field(..., description="이메일")
    password: str = Field(..., min_length=8, max_length=64, description="비밀번호 (bcrypt 제한으로 최대 64자)")
    skala_id: str = Field(..., min_length=1, max_length=50, description="SKALA 고유번호")
    interests: list[CategoryCode] = Field(default_factory=list, description="관심분야 (복수 선택)")

    @field_validator("username")
    @classmethod
    def username_alnum(cls, v: str) -> str:
        if not v.isascii() or not v.replace("_", "").isalnum():
            raise ValueError("아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.")
        return v


class LoginRequest(BaseModel):
    """로그인 요청 바디."""

    username: str
    password: str
    remember_me: bool = Field(default=False, description="로그인 유지 여부")


class TokenResponse(BaseModel):
    """로그인 성공 시 반환되는 JWT 토큰 응답."""

    access_token: str
    token_type: str = "bearer"


class DuplicateCheckResponse(BaseModel):
    """아이디/이메일/SKALA 고유번호 중복 확인 응답."""

    available: bool


class UserSummary(BaseModel):
    """스터디 목록 등에서 작성자 정보를 간단히 보여줄 때 사용."""

    id: int
    name: str
    username: str

    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    """마이페이지 등에서 사용하는 내 정보 응답."""

    id: int
    name: str
    username: str
    email: str
    skala_id: str
    is_admin: bool
    interests: list[str]
    joined_study_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserResponse(BaseModel):
    """관리자용 회원 목록 응답."""

    id: int
    name: str
    username: str
    email: str
    skala_id: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}
