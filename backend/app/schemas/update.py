"""
업데이트 공지 관련 요청/응답 스키마.
"""
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import UpdateCategory


class UpdateCreateRequest(BaseModel):
    """관리자의 업데이트 공지 작성 요청 바디."""

    title: str = Field(..., min_length=1, max_length=200, description="제목")
    content: str = Field(..., min_length=1, description="내용")
    version: str | None = Field(default=None, max_length=30, description="버전 (예: v1.2.0)")
    category: UpdateCategory = Field(..., description="카테고리")
    is_active: bool = Field(default=True, description="공지 활성화 여부")


class UpdateEditRequest(BaseModel):
    """관리자의 업데이트 공지 수정 요청 바디. 값이 온 필드만 수정한다."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1)
    version: str | None = Field(default=None, max_length=30)
    category: UpdateCategory | None = None
    is_active: bool | None = None


class UpdateResponse(BaseModel):
    id: int
    title: str
    content: str
    version: str | None
    category: str
    category_label: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
