"""
교육과정/단원 조회, 단원별 Q&A 채팅(질문 등록/답변 채택), 전문가 추천 API.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.curriculum import Curriculum, Topic
from app.models.enums import SkillLevel
from app.models.topic_message import TopicMessage
from app.models.user import User, UserSkill
from app.schemas.curriculum import CurriculumListResponse, CurriculumResponse, TopicListResponse
from app.schemas.topic_message import TopicMessageCreateRequest, TopicMessageResponse
from app.schemas.user import UserSummary
from app.utils.curriculum_mapper import to_curriculum_response, to_topic_response
from app.utils.topic_message_mapper import to_new_topic_message_response, to_topic_message_responses

router = APIRouter(prefix="/api/curricula", tags=["교육과정"])


def _base_curriculum_query():
    return select(Curriculum).options(selectinload(Curriculum.topics), selectinload(Curriculum.members))


def _get_curriculum_or_404(db: Session, curriculum_id: int) -> Curriculum:
    curriculum = db.scalar(_base_curriculum_query().where(Curriculum.id == curriculum_id))
    if curriculum is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "교육과정을 찾을 수 없습니다.")
    return curriculum


@router.get("", response_model=CurriculumListResponse, summary="교육과정 목록 조회")
def list_curricula(db: Session = Depends(get_db)):
    curricula = db.scalars(_base_curriculum_query().order_by(Curriculum.created_at.desc())).unique().all()
    items = [to_curriculum_response(c) for c in curricula]
    return CurriculumListResponse(total=len(items), items=items)


@router.get("/{curriculum_id}", response_model=CurriculumResponse, summary="교육과정 상세 조회")
def get_curriculum(curriculum_id: int, db: Session = Depends(get_db)):
    curriculum = _get_curriculum_or_404(db, curriculum_id)
    return to_curriculum_response(curriculum)


@router.get(
    "/{curriculum_id}/topics",
    response_model=TopicListResponse,
    summary="단원 목록 조회 (단원별 메시지 수 포함)",
)
def list_topics(curriculum_id: int, db: Session = Depends(get_db)):
    curriculum = _get_curriculum_or_404(db, curriculum_id)
    topics = sorted(curriculum.topics, key=lambda t: t.order_index)

    counts = dict(
        db.execute(
            select(TopicMessage.topic_id, func.count())
            .where(TopicMessage.topic_id.in_([t.id for t in topics]))
            .group_by(TopicMessage.topic_id)
        ).all()
    )
    items = [to_topic_response(t, counts.get(t.id, 0)) for t in topics]
    return TopicListResponse(total=len(items), items=items)


def _get_topic_or_404(db: Session, topic_id: int) -> Topic:
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "단원을 찾을 수 없습니다.")
    return topic


def _require_curriculum_member(topic: Topic, current_user: User) -> None:
    if current_user.curriculum_id != topic.curriculum_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "해당 교육과정 소속 회원만 이용할 수 있습니다.")


@router.get(
    "/topics/{topic_id}/messages",
    response_model=list[TopicMessageResponse],
    summary="단원 Q&A 채팅 메시지 목록 조회 (같은 교육과정 소속만)",
)
def list_topic_messages(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic = _get_topic_or_404(db, topic_id)
    _require_curriculum_member(topic, current_user)

    # 최근 200개만 오래된 순으로 반환 (스터디 채팅과 동일한 정책)
    rows = db.scalars(
        select(TopicMessage)
        .options(selectinload(TopicMessage.user))
        .where(TopicMessage.topic_id == topic_id)
        .order_by(TopicMessage.created_at.desc(), TopicMessage.id.desc())
        .limit(200)
    ).all()

    return to_topic_message_responses(list(reversed(rows)), current_user_id=current_user.id)


@router.post(
    "/topics/{topic_id}/messages",
    response_model=TopicMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="단원 Q&A 채팅 메시지 전송 (질문 등록 포함)",
)
def send_topic_message(
    topic_id: int,
    payload: TopicMessageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic = _get_topic_or_404(db, topic_id)
    _require_curriculum_member(topic, current_user)

    if payload.reply_to_id is not None:
        parent = db.get(TopicMessage, payload.reply_to_id)
        if parent is None or parent.topic_id != topic_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "답변 대상 메시지를 찾을 수 없습니다.")

    message = TopicMessage(
        topic_id=topic_id,
        user_id=current_user.id,
        content=payload.content,
        is_question=payload.is_question,
        category=payload.category if payload.is_question else None,
        reply_to_id=payload.reply_to_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return to_new_topic_message_response(message, sender_name=current_user.name)


@router.post(
    "/topics/{topic_id}/messages/{message_id}/accept",
    response_model=TopicMessageResponse,
    summary="답변 채택 (질문 작성자 본인만, 질문 하나당 1회성)",
)
def accept_topic_message(
    topic_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic = _get_topic_or_404(db, topic_id)
    _require_curriculum_member(topic, current_user)

    reply = db.get(TopicMessage, message_id)
    if reply is None or reply.topic_id != topic_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "메시지를 찾을 수 없습니다.")
    if reply.reply_to_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "답변 메시지만 채택할 수 있습니다.")

    question = db.get(TopicMessage, reply.reply_to_id)
    if question is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "원본 질문을 찾을 수 없습니다.")
    if question.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "질문 작성자만 답변을 채택할 수 있습니다.")

    already_accepted = db.scalar(
        select(TopicMessage).where(
            TopicMessage.reply_to_id == question.id, TopicMessage.is_accepted.is_(True)
        )
    )
    if already_accepted is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 채택된 질문입니다.")

    reply.is_accepted = True
    db.commit()
    db.refresh(reply)

    return to_new_topic_message_response(reply, sender_name=reply.user.name)


@router.get(
    "/topics/{topic_id}/experts",
    response_model=list[UserSummary],
    summary="질문 작성 시 해당 분야 이해도가 HIGH인 같은 교육과정 소속 멤버 추천",
)
def suggest_experts(
    topic_id: int,
    category: str = Query(..., min_length=1, max_length=50, description="질문 분야"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic = _get_topic_or_404(db, topic_id)
    _require_curriculum_member(topic, current_user)

    rows = db.scalars(
        select(User)
        .join(UserSkill, UserSkill.user_id == User.id)
        .where(
            User.curriculum_id == topic.curriculum_id,
            func.lower(func.trim(UserSkill.category)) == category.strip().lower(),
            UserSkill.level == SkillLevel.HIGH.value,
        )
        .order_by(User.name)
    ).all()
    return [UserSummary.model_validate(u) for u in rows]
