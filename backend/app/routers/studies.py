"""
스터디 생성/목록/검색/참여/탈퇴 관련 API.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.enums import (
    RECOMMENDATION_COOLDOWN_HOURS,
    RECOMMENDATION_POINTS,
    RECOMMENDATION_TAG_LABELS,
    Campus,
    CategoryCode,
    DayOfWeek,
    Location,
)
from app.models.message import StudyMessage
from app.models.recommendation import LeaderRecommendation, RecommendationCooldown
from app.models.study import Study, StudyDay, StudyMember
from app.models.user import User
from app.schemas.message import MessageCreateRequest, MessageResponse
from app.schemas.recommendation import RecommendLeaderRequest, RecommendLeaderResponse
from app.schemas.study import StudyCreateRequest, StudyListResponse, StudyMemberResponse, StudyResponse
from app.utils.study_mapper import to_study_response

router = APIRouter(prefix="/api/studies", tags=["스터디"])


def _base_query():
    """스터디 조회 시 N+1 쿼리를 피하기 위해 관련 엔티티를 미리 로딩한다."""
    return select(Study).options(
        selectinload(Study.creator),
        selectinload(Study.members).selectinload(StudyMember.user),
        selectinload(Study.days),
    )


@router.post("", response_model=StudyResponse, status_code=status.HTTP_201_CREATED, summary="스터디 생성")
def create_study(
    payload: StudyCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    study = Study(
        name=payload.name,
        category=payload.category.value,
        capacity=payload.capacity,
        description=payload.description,
        time=payload.time,
        location=payload.location.value,
        is_online=payload.is_online,
        exam_date=payload.exam_date,
        creator_id=current_user.id,  # 작성자는 로그인한 회원으로 자동 저장
    )
    db.add(study)
    db.flush()

    # 선택된 요일들을 저장 (중복 제거 후 저장)
    for day in dict.fromkeys(payload.days):
        db.add(StudyDay(study_id=study.id, day_of_week=day.value))

    # 스터디 생성자는 자동으로 첫 참여 멤버가 된다.
    db.add(StudyMember(study_id=study.id, user_id=current_user.id))
    db.commit()
    db.refresh(study)

    return to_study_response(study, current_user_id=current_user.id)


@router.get("", response_model=StudyListResponse, summary="스터디 목록 조회 (검색/필터)")
def list_studies(
    keyword: str | None = Query(default=None, description="스터디명 검색어"),
    category: CategoryCode | None = Query(default=None, description="카테고리 필터"),
    day_of_week: DayOfWeek | None = Query(default=None, description="요일 필터"),
    location: Location | None = Query(default=None, description="장소 필터"),
    is_online: bool | None = Query(default=None, description="온라인 여부 필터"),
    campus: Campus | None = Query(default=None, description="캠퍼스 필터 (개설자 소속 캠퍼스 기준)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = _base_query()

    if keyword:
        query = query.where(Study.name.ilike(f"%{keyword}%"))
    if category:
        query = query.where(Study.category == category.value)
    if day_of_week:
        query = query.where(Study.days.any(StudyDay.day_of_week == day_of_week.value))
    if location:
        query = query.where(Study.location == location.value)
    if is_online is not None:
        query = query.where(Study.is_online == is_online)
    if campus:
        query = query.join(User, Study.creator_id == User.id).where(User.campus == campus.value)

    query = query.order_by(Study.created_at.desc())

    studies = db.scalars(query).unique().all()
    items = [to_study_response(s, current_user_id=current_user.id) for s in studies]
    return StudyListResponse(total=len(items), items=items)


@router.get("/my", response_model=StudyListResponse, summary="내가 참여중인 스터디 목록")
def list_my_studies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        _base_query()
        .join(StudyMember, StudyMember.study_id == Study.id)
        .where(StudyMember.user_id == current_user.id)
        .order_by(Study.created_at.desc())
    )
    studies = db.scalars(query).unique().all()
    items = [to_study_response(s, current_user_id=current_user.id) for s in studies]
    return StudyListResponse(total=len(items), items=items)


def _get_study_or_404(db: Session, study_id: int) -> Study:
    study = db.scalar(_base_query().where(Study.id == study_id))
    if study is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "스터디를 찾을 수 없습니다.")
    return study


@router.get("/{study_id}", response_model=StudyResponse, summary="스터디 상세 조회")
def get_study(
    study_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    study = _get_study_or_404(db, study_id)
    return to_study_response(study, current_user_id=current_user.id)


@router.get(
    "/{study_id}/members",
    response_model=list[StudyMemberResponse],
    summary="스터디 참여자 목록 조회 (개설자 전용)",
)
def list_study_members(
    study_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    study = _get_study_or_404(db, study_id)

    if study.creator_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "스터디 개설자만 참여자 목록을 볼 수 있습니다.")

    members_sorted = sorted(study.members, key=lambda m: m.joined_at)
    return [
        StudyMemberResponse(
            id=m.user.id,
            name=m.user.name,
            username=m.user.username,
            campus=m.user.campus,
            campus_label=m.user.campus_label,
            joined_at=m.joined_at,
        )
        for m in members_sorted
    ]


def _require_member(study: Study, current_user: User) -> None:
    member_ids = {m.user_id for m in study.members}
    if current_user.id not in member_ids:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "스터디 참여자만 채팅을 이용할 수 있습니다.")


@router.get(
    "/{study_id}/messages",
    response_model=list[MessageResponse],
    summary="스터디 채팅 메시지 목록 조회 (참여자 전용)",
)
def list_study_messages(
    study_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    study = _get_study_or_404(db, study_id)
    _require_member(study, current_user)

    # 최근 200개만 오래된 순으로 반환 (무한정 쌓이지 않도록 조회 범위 제한)
    # created_at만으로는 짧은 시간 내 동시 전송 시 정렬이 흔들릴 수 있어 id를 보조 정렬 기준으로 사용한다.
    rows = db.scalars(
        select(StudyMessage)
        .options(selectinload(StudyMessage.user))
        .where(StudyMessage.study_id == study_id)
        .order_by(StudyMessage.created_at.desc(), StudyMessage.id.desc())
        .limit(200)
    ).all()

    return [
        MessageResponse(
            id=m.id,
            sender_id=m.user_id,
            sender_name=m.user.name,
            content=m.content,
            created_at=m.created_at,
            is_mine=m.user_id == current_user.id,
        )
        for m in reversed(rows)
    ]


@router.post(
    "/{study_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="스터디 채팅 메시지 전송 (참여자 전용)",
)
def send_study_message(
    study_id: int,
    payload: MessageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    study = _get_study_or_404(db, study_id)
    _require_member(study, current_user)

    message = StudyMessage(study_id=study_id, user_id=current_user.id, content=payload.content)
    db.add(message)
    db.commit()
    db.refresh(message)

    return MessageResponse(
        id=message.id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        content=message.content,
        created_at=message.created_at,
        is_mine=True,
    )


@router.post(
    "/{study_id}/recommend-leader",
    response_model=RecommendLeaderResponse,
    summary="모임장 익명 추천 (+포인트)",
)
def recommend_leader(
    study_id: int,
    payload: RecommendLeaderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    study = _get_study_or_404(db, study_id)
    member_ids = {m.user_id for m in study.members}

    if current_user.id not in member_ids:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "스터디 참여자만 모임장을 추천할 수 있습니다.")
    if current_user.id == study.creator_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "본인이 개설한 스터디는 추천할 수 없습니다.")

    now = datetime.now(timezone.utc)
    cooldown = db.scalar(
        select(RecommendationCooldown).where(
            RecommendationCooldown.user_id == current_user.id,
            RecommendationCooldown.study_id == study.id,
        )
    )
    if cooldown is not None:
        # DB에는 timezone 정보 없이 저장될 수 있어 비교 전에 UTC로 맞춰준다.
        last = cooldown.last_recommended_at
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        if now - last < timedelta(hours=RECOMMENDATION_COOLDOWN_HOURS):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "이 스터디는 하루에 한 번만 추천할 수 있습니다.")
        cooldown.last_recommended_at = now
    else:
        db.add(RecommendationCooldown(user_id=current_user.id, study_id=study.id, last_recommended_at=now))

    db.add(
        LeaderRecommendation(
            leader_id=study.creator_id,
            study_id=study.id,
            points_given=RECOMMENDATION_POINTS,
            reason_tag=payload.reason_tag.value,
        )
    )
    # 리더(개설자)에게 포인트를 적립한다. 익명 추천이므로 누가 줬는지는 어디에도 저장하지 않는다.
    study.creator.points += RECOMMENDATION_POINTS

    db.commit()

    return RecommendLeaderResponse(
        message="익명으로 모임장님께 포인트와 칭찬 메시지를 전달했습니다.",
        points_given=RECOMMENDATION_POINTS,
        reason_label=RECOMMENDATION_TAG_LABELS[payload.reason_tag.value],
    )


@router.post("/{study_id}/join", response_model=StudyResponse, summary="스터디 참여")
def join_study(
    study_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    study = _get_study_or_404(db, study_id)
    member_ids = {m.user_id for m in study.members}

    if current_user.id in member_ids:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 참여중인 스터디입니다.")
    if len(member_ids) >= study.capacity:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "모집 인원이 마감된 스터디입니다.")

    db.add(StudyMember(study_id=study.id, user_id=current_user.id))
    db.commit()
    db.refresh(study)

    return to_study_response(study, current_user_id=current_user.id)


@router.delete("/{study_id}/leave", status_code=status.HTTP_200_OK, summary="스터디 탈퇴")
def leave_study(
    study_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = db.scalar(
        select(StudyMember).where(
            StudyMember.study_id == study_id, StudyMember.user_id == current_user.id
        )
    )
    if membership is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "참여중인 스터디가 아닙니다.")

    db.delete(membership)
    db.commit()
    return {"message": "스터디에서 탈퇴했습니다."}


@router.delete("/{study_id}", status_code=status.HTTP_200_OK, summary="스터디 삭제 (개설자 본인만)")
def delete_study(
    study_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    study = _get_study_or_404(db, study_id)

    if study.creator_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인이 개설한 스터디만 삭제할 수 있습니다.")

    db.delete(study)
    db.commit()
    return {"message": "스터디가 삭제되었습니다."}
