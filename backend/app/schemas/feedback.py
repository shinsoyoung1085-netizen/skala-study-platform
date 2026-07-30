"""
SKALA STUDY 앱 자체에 대한 익명 후기/건의 게시글 요청/응답 스키마.
"""
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import FeedbackCategory


class FeedbackCreateRequest(BaseModel):
    category: FeedbackCategory = Field(..., description="분류 (칭찬/건의/버그 제보/기타)")
    content: str = Field(..., min_length=1, max_length=1000, description="후기/건의 내용")


class FeedbackEditRequest(BaseModel):
    """본인 글 수정 요청. 값이 주어진 필드만 변경한다."""

    category: FeedbackCategory | None = None
    content: str | None = Field(default=None, min_length=1, max_length=1000)


class FeedbackAdminUpdateRequest(BaseModel):
    """관리자의 답변 작성/수정 및 해결 상태 변경 요청. 값이 주어진 필드만 변경한다."""

    admin_reply: str | None = Field(default=None, min_length=1, max_length=1000)
    is_resolved: bool | None = None


class FeedbackResponse(BaseModel):
    """
    작성자 정보는 어떤 필드로도 포함하지 않는다 (완전 익명).
    is_mine만 본인 글 여부를 알려줘서, 프론트에서 본인 글 수정/삭제 버튼을 띄울 수 있게 한다.
    """

    id: int
    category: str
    category_label: str
    content: str
    is_mine: bool
    is_resolved: bool
    admin_reply: str | None
    replied_at: datetime | None
    created_at: datetime


class FeedbackListResponse(BaseModel):
    total: int
    items: list[FeedbackResponse]


class FeedbackAiDraftResponse(BaseModel):
    """AI가 생성한 현실성 검토 및 답변 초안. 그대로 게시되지 않고 관리자 검토용으로만 반환된다."""

    feasibility_note: str
    draft_reply: str
    suggested_resolved: bool
