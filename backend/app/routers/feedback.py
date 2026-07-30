"""
SKALA STUDY 앱 자체에 대한 익명 후기/건의 게시판 API.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import (
    FeedbackCreateRequest,
    FeedbackEditRequest,
    FeedbackListResponse,
    FeedbackResponse,
)
from app.utils.feedback_mapper import to_feedback_response

router = APIRouter(prefix="/api/feedback", tags=["후기/건의"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, summary="익명 후기/건의 작성")
def create_feedback(
    payload: FeedbackCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = Feedback(user_id=current_user.id, category=payload.category.value, content=payload.content)
    db.add(item)
    db.commit()
    db.refresh(item)
    return to_feedback_response(item, current_user)


@router.get("", response_model=FeedbackListResponse, summary="익명 후기/건의 목록 조회")
def list_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.scalars(select(Feedback).order_by(Feedback.created_at.desc())).all()
    return FeedbackListResponse(
        total=len(items), items=[to_feedback_response(item, current_user) for item in items]
    )


@router.patch("/{feedback_id}", response_model=FeedbackResponse, summary="후기/건의 수정 (본인 글만)")
def edit_feedback(
    feedback_id: int,
    payload: FeedbackEditRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(Feedback, feedback_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "게시글을 찾을 수 없습니다.")
    if item.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인 글만 수정할 수 있습니다.")

    if payload.category is not None:
        item.category = payload.category.value
    if payload.content is not None:
        item.content = payload.content

    db.commit()
    db.refresh(item)
    return to_feedback_response(item, current_user)


@router.delete("/{feedback_id}", summary="후기/건의 삭제 (본인 글 또는 관리자)")
def delete_feedback(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(Feedback, feedback_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "게시글을 찾을 수 없습니다.")
    if item.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인 글 또는 관리자만 삭제할 수 있습니다.")

    db.delete(item)
    db.commit()
    return {"message": "삭제되었습니다."}
