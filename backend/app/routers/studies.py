"""
스터디 생성/목록/검색/참여/탈퇴 관련 API.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.enums import CategoryCode, DayOfWeek, Location
from app.models.study import Study, StudyDay, StudyMember
from app.models.user import User
from app.schemas.study import StudyCreateRequest, StudyListResponse, StudyResponse
from app.utils.study_mapper import to_study_response

router = APIRouter(prefix="/api/studies", tags=["스터디"])


def _base_query():
    """스터디 조회 시 N+1 쿼리를 피하기 위해 관련 엔티티를 미리 로딩한다."""
    return select(Study).options(
        selectinload(Study.creator), selectinload(Study.members), selectinload(Study.days)
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
