"""
스터디(Study) 관련 요청/응답 스키마.
"""
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import CategoryCode, DayOfWeek, Location
from app.schemas.user import UserSummary


class StudyCreateRequest(BaseModel):
    """스터디 생성 요청 바디. 작성자는 로그인한 회원으로 서버에서 자동 설정된다."""

    name: str = Field(..., min_length=1, max_length=100, description="스터디명")
    category: CategoryCode = Field(..., description="카테고리")
    capacity: int = Field(..., ge=2, le=100, description="모집인원")
    description: str = Field(default="", max_length=2000, description="스터디 설명")
    days: list[DayOfWeek] = Field(
        ..., min_length=1, description="진행 요일 (복수 선택 가능: 월수금, 주말, 매일 등 자유 조합)"
    )
    time: str = Field(..., min_length=1, max_length=20, description="시간 (예: 19:00)")
    location: Location = Field(..., description="장소")
    is_online: bool = Field(default=False, description="온라인 여부")
    exam_date: date | None = Field(default=None, description="목표 시험일자 (선택, 자격증/어학 스터디용)")


class StudyResponse(BaseModel):
    """스터디 카드/상세에서 사용하는 응답 스키마."""

    id: int
    name: str
    category: str
    category_label: str
    capacity: int
    description: str
    days: list[str]
    day_label: str
    time: str
    location: str
    location_label: str
    is_online: bool
    exam_date: date | None
    current_member_count: int
    is_full: bool
    creator: UserSummary
    is_joined: bool = Field(default=False, description="현재 로그인한 회원의 참여 여부")
    created_at: datetime

    model_config = {"from_attributes": True}


class StudyListResponse(BaseModel):
    total: int
    items: list[StudyResponse]
