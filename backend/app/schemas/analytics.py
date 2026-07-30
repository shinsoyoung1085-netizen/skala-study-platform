"""
회원별/기능별 방문 로그 기록 및 관리자 이용 분석 대시보드 관련 스키마.
"""
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import AppFeature


class TrackVisitRequest(BaseModel):
    feature: AppFeature = Field(..., description="방문한 화면(기능) 키")


class CampusVisitCount(BaseModel):
    campus: str
    label: str
    visit_count: int


class FeatureVisitCount(BaseModel):
    feature: str
    label: str
    visit_count: int


class UserVisitCount(BaseModel):
    user_id: int
    name: str
    campus_label: str
    visit_count: int
    last_visited_at: datetime | None = None


class AnalyticsOverviewResponse(BaseModel):
    total_visits: int
    by_campus: list[CampusVisitCount]
    by_feature: list[FeatureVisitCount]
    top_users: list[UserVisitCount] = Field(description="방문 횟수 상위 회원 (최대 50명)")
