"""
모임장 익명 추천 및 포인트 관련 요청/응답 스키마.
"""
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import RecommendationTag


class RecommendLeaderRequest(BaseModel):
    """스터디 리더 추천 요청 바디. 익명성 보호를 위해 자유 텍스트가 아닌 사전 정의 태그만 받는다."""

    reason_tag: RecommendationTag = Field(..., description="추천 사유 태그")


class RecommendLeaderResponse(BaseModel):
    message: str
    points_given: int
    reason_label: str


class ReceivedRecommendationItem(BaseModel):
    """내가 리더로서 받은 익명 칭찬 1건 (추천자 정보는 절대 포함하지 않는다)."""

    study_name: str
    reason_tag: str
    reason_label: str
    points_given: int
    created_at: datetime


class MyPointsResponse(BaseModel):
    """마이페이지 등에서 사용하는 내 포인트 및 익명 칭찬 내역."""

    points: int
    recommendations_received: list[ReceivedRecommendationItem]


class AdminRecommendationLogItem(BaseModel):
    """관리자용 추천/포인트 지급 내역 (여기서도 추천자 정보는 노출하지 않는다)."""

    id: int
    leader_name: str
    leader_username: str
    study_name: str
    points_given: int
    reason_tag: str
    reason_label: str
    created_at: datetime
