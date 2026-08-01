"""
회원(User) 관련 요청/응답 스키마.
"""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import Campus, CategoryCode, SkillLevel
from app.schemas.curriculum import CurriculumSummary
from app.schemas.leaderboard import ClassSummary


class SignupRequest(BaseModel):
    """회원가입 요청 바디."""

    name: str = Field(..., min_length=1, max_length=50, description="이름")
    username: str = Field(..., min_length=4, max_length=50, description="아이디")
    email: EmailStr = Field(..., description="이메일")
    password: str = Field(..., min_length=8, max_length=64, description="비밀번호 (bcrypt 제한으로 최대 64자)")
    skala_id: str = Field(..., min_length=1, max_length=50, description="SKALA 고유번호")
    campus: Campus = Field(..., description="소속 캠퍼스 (판교/광주/울산)")
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


class FindUsernameRequest(BaseModel):
    """아이디 찾기 요청. 이름/SKALA 고유번호/이메일이 모두 일치하는 계정을 찾는다."""

    name: str = Field(..., min_length=1, max_length=50)
    skala_id: str = Field(..., min_length=1, max_length=50)
    email: EmailStr


class FindUsernameResponse(BaseModel):
    username: str


class FindPasswordRequest(BaseModel):
    """비밀번호 찾기(임시 비밀번호 발급) 요청. 아이디/이름/SKALA 고유번호/이메일이 모두 일치해야 한다."""

    username: str
    name: str = Field(..., min_length=1, max_length=50)
    skala_id: str = Field(..., min_length=1, max_length=50)
    email: EmailStr


class FindPasswordResponse(BaseModel):
    temporary_password: str


class UserSummary(BaseModel):
    """스터디 목록 등에서 작성자 정보를 간단히 보여줄 때 사용."""

    id: int
    name: str
    username: str

    model_config = {"from_attributes": True}


class UserSkillItem(BaseModel):
    """역량 프로필 등록/수정 요청의 항목 하나."""

    category: str = Field(..., min_length=1, max_length=50, description="분야 (자유 텍스트, 예: 운영체제)")
    level: SkillLevel = Field(..., description="이해도 (상/중/하)")


class UserSkillUpdateRequest(BaseModel):
    """내 역량 프로필 전체 교체 요청 (관심분야 저장 방식과 동일하게 매번 전체를 다시 저장한다)."""

    skills: list[UserSkillItem] = Field(default_factory=list)


class UserSkillResponse(BaseModel):
    category: str
    level: str
    level_label: str


class UserProfileResponse(BaseModel):
    """마이페이지 등에서 사용하는 내 정보 응답."""

    id: int
    name: str
    username: str
    email: str
    skala_id: str
    campus: str
    campus_label: str
    is_admin: bool
    is_main_admin: bool
    interests: list[str]
    joined_study_count: int
    points: int = Field(description="모임장 익명 추천으로 적립된 누적 포인트")
    picture_url: str | None = Field(default=None, description="구글 로그인 연동 시 프로필 사진")
    has_password: bool = Field(description="비밀번호 로그인 사용 가능 여부 (구글 전용 계정은 false)")
    google_linked: bool = Field(description="구글 계정 연동 여부")
    skills: list[UserSkillResponse] = Field(default_factory=list, description="분야별 이해도(역량) 프로필")
    curriculum: CurriculumSummary | None = Field(default=None, description="소속 교육과정")
    study_class: ClassSummary | None = Field(default=None, description="소속 반 (리더보드)")
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    """마이페이지에서 아이디/이메일/캠퍼스를 수정할 때 사용하는 요청 바디. 값이 온 필드만 수정한다."""

    username: str | None = Field(default=None, min_length=4, max_length=50, description="아이디")
    email: EmailStr | None = Field(default=None, description="이메일")
    campus: Campus | None = Field(default=None, description="소속 캠퍼스")

    @field_validator("username")
    @classmethod
    def username_alnum(cls, v: str | None) -> str | None:
        if v is not None and (not v.isascii() or not v.replace("_", "").isalnum()):
            raise ValueError("아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.")
        return v


class ClassAssignRequest(BaseModel):
    """마이페이지에서 소속 반을 선택/변경할 때 사용하는 요청 바디."""

    class_id: int = Field(..., description="선택할 반 ID (본인 캠퍼스 내 반이어야 한다)")


class ChangePasswordRequest(BaseModel):
    """마이페이지에서 비밀번호를 변경할 때 사용하는 요청 바디."""

    current_password: str = Field(..., description="현재 비밀번호")
    new_password: str = Field(..., min_length=8, max_length=64, description="새 비밀번호")


class DeleteAccountRequest(BaseModel):
    """회원 탈퇴 요청 바디. 비밀번호가 있는 계정은 본인 확인을 위해 비밀번호를 다시 입력받는다."""

    password: str | None = Field(default=None, description="현재 비밀번호 (구글 전용 계정은 불필요)")


class AdminPasswordResetResponse(BaseModel):
    """[관리자] 회원 비밀번호 재설정 응답. 발급된 임시 비밀번호를 관리자가 본인에게 직접 전달해야 한다."""

    temporary_password: str = Field(description="새로 발급된 임시 비밀번호 (평문, 이 응답에서만 확인 가능)")


class AdminUserResponse(BaseModel):
    """관리자용 회원 목록 응답."""

    id: int
    name: str
    username: str
    email: str
    skala_id: str
    campus: str
    campus_label: str
    is_admin: bool
    is_main_admin: bool
    points: int
    created_at: datetime

    model_config = {"from_attributes": True}
