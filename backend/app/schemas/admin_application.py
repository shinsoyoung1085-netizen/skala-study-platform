"""
관리자 권한 신청 관련 요청/응답 스키마.
"""
from datetime import datetime

from pydantic import BaseModel, Field


class AdminApplicationCreateRequest(BaseModel):
    reason: str = Field(default="", max_length=500, description="관리자 신청 사유 (선택)")


class AdminApplicationResponse(BaseModel):
    """신청자 본인이 자신의 신청 상태를 확인할 때 사용."""

    id: int
    reason: str
    status: str
    status_label: str
    created_at: datetime
    reviewed_at: datetime | None


class AdminApplicationAdminItem(BaseModel):
    """메인 관리자가 신청 목록을 조회할 때 사용."""

    id: int
    applicant_name: str
    applicant_username: str
    reason: str
    status: str
    status_label: str
    created_at: datetime
    reviewed_at: datetime | None
    reviewed_by_name: str | None
