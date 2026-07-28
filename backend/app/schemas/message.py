"""
스터디 채팅 메시지 관련 요청/응답 스키마.
"""
from datetime import datetime

from pydantic import BaseModel, Field


class MessageCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000, description="채팅 메시지 내용")


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    content: str
    created_at: datetime
    is_mine: bool = Field(default=False, description="현재 로그인한 회원이 보낸 메시지인지 여부")
