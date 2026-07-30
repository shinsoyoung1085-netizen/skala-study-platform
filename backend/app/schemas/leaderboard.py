"""
게임화 리더보드 대시보드 및 하트비트 관련 요청/응답 스키마.
"""
from datetime import date

from pydantic import BaseModel, Field

from app.models.enums import Campus


class ClassCreateRequest(BaseModel):
    """[관리자] 반 생성 요청 바디."""

    campus: Campus = Field(..., description="소속 캠퍼스 (판교/광주/울산)")
    name: str = Field(..., min_length=1, max_length=50, description="반 이름 (예: 1반)")


class AdminClassResponse(BaseModel):
    """[관리자] 반 목록/생성 응답."""

    id: int
    campus: str
    campus_label: str
    name: str
    member_count: int


class ClassOption(BaseModel):
    """반 선택 드롭다운에서 사용하는 항목 (본인 캠퍼스 내 반 목록 조회 응답)."""

    id: int
    campus: str
    name: str

    model_config = {"from_attributes": True}


class ClassSummary(BaseModel):
    """다른 응답(내 정보 등)에 소속 반을 간단히 표시할 때 사용."""

    id: int
    name: str

    model_config = {"from_attributes": True}


class HeartbeatRequest(BaseModel):
    """공부 시간 하트비트 요청 바디."""

    elapsed_seconds: int = Field(..., ge=0, description="직전 하트비트 이후 경과 시간(초)")


class HeartbeatResponse(BaseModel):
    today_seconds: int = Field(description="오늘 누적 공부시간(초, 일 상한 캡핑 적용됨)")


class DailyBreakdownItem(BaseModel):
    log_date: date
    seconds: int


class RankBadge(BaseModel):
    rank: int
    total: int = Field(description="비교 모수 (반 인원 수 / 캠퍼스 내 반 개수 / 캠퍼스 개수)")


class CampusProgress(BaseModel):
    campus: str
    label: str
    avg_seconds: int = Field(description="1인당 평균 공부시간(초) - 공정 비교 지표")


class DashboardResponse(BaseModel):
    my_weekly_seconds: int
    my_daily_breakdown: list[DailyBreakdownItem]
    individual_rank_in_class: RankBadge | None = Field(description="반 내 개인 순위 (미배정 시 None)")
    class_rank_in_campus: RankBadge | None = Field(description="캠퍼스 내 우리 반 순위 (미배정 시 None)")
    campus_rank_overall: RankBadge | None = Field(description="전체 캠퍼스 중 내 캠퍼스 순위")
    campus_progress: list[CampusProgress] = Field(description="캠퍼스별 1인당 평균 공부시간 비교(진행바용)")
    qualifies_this_week: bool = Field(description="주 10시간 자격 조건 충족 여부")
