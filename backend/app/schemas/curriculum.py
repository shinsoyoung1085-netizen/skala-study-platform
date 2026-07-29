"""
교육과정(Curriculum) 및 단원(Topic) 관련 요청/응답 스키마.
"""
from datetime import datetime

from pydantic import BaseModel, Field


class CurriculumSummary(BaseModel):
    """다른 응답(내 정보 등)에 소속 교육과정을 간단히 표시할 때 사용."""

    id: int
    title: str

    model_config = {"from_attributes": True}


class CurriculumCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="교육과정명")
    description: str = Field(default="", max_length=2000, description="설명")


class CurriculumResponse(BaseModel):
    id: int
    title: str
    description: str
    topic_count: int
    member_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CurriculumListResponse(BaseModel):
    total: int
    items: list[CurriculumResponse]


class TopicCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="단원명")
    order: int = Field(..., ge=1, description="정렬 순서")


class TopicResponse(BaseModel):
    id: int
    curriculum_id: int
    title: str
    order: int
    message_count: int


class TopicListResponse(BaseModel):
    total: int
    items: list[TopicResponse]


class CurriculumAssignRequest(BaseModel):
    curriculum_id: int = Field(..., description="소속시킬 교육과정 id")
