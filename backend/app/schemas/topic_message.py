"""
단원(Topic) Q&A 채팅 메시지 관련 요청/응답 스키마. message.py(스터디 채팅)와 동일한 스타일.
"""
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class TopicMessageCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000, description="채팅 메시지 내용")
    is_question: bool = Field(default=False, description="질문으로 등록할지 여부")
    category: str | None = Field(default=None, max_length=50, description="질문 분야 (is_question=True일 때 필수)")
    reply_to_id: int | None = Field(default=None, description="답변 대상 질문 메시지 id")

    @model_validator(mode="after")
    def validate_question_category(self) -> "TopicMessageCreateRequest":
        if self.is_question and not self.category:
            raise ValueError("질문으로 등록하려면 분야(category)를 선택해야 합니다.")
        return self


class TopicMessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    content: str
    is_question: bool
    category: str | None
    reply_to_id: int | None
    is_accepted: bool
    is_solved: bool = Field(default=False, description="질문 메시지인 경우, 채택된 답변이 있는지 여부")
    created_at: datetime
    is_mine: bool = Field(default=False, description="현재 로그인한 회원이 보낸 메시지인지 여부")
