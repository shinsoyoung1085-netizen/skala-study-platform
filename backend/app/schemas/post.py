"""
정보 공유 게시글(Post) 관련 요청/응답 스키마.
"""
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import UserSummary


class PostCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="게시글 내용")
    tags: list[str] = Field(..., min_length=1, description="태그 (1개 이상 필수)")


class PostResponse(BaseModel):
    id: int
    curriculum_id: int
    author: UserSummary
    content: str
    tags: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class PostListResponse(BaseModel):
    total: int
    items: list[PostResponse]
