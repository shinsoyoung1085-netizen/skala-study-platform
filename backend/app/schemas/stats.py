"""
전체 서비스 통계(가입자 수 등) 관련 응답 스키마.
"""
from pydantic import BaseModel


class CampusCount(BaseModel):
    code: str
    label: str
    count: int


class MemberStatsResponse(BaseModel):
    total_members: int
    campus_counts: list[CampusCount]


class HomeVisitResponse(BaseModel):
    total_visits: int
