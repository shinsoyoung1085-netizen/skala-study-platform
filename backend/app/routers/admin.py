"""
관리자 전용 API: 회원/스터디 목록 조회 및 삭제.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.security import generate_temporary_password, hash_password
from app.db.database import get_db
from app.dependencies import get_current_admin, get_current_main_admin
from app.models.admin_application import AdminApplication
from app.models.curriculum import Curriculum, Topic
from app.models.analytics import PageVisit
from app.models.enums import (
    APP_FEATURE_LABELS,
    APPLICATION_STATUS_LABELS,
    CAMPUS_LABELS,
    FEEDBACK_CATEGORY_LABELS,
    RECOMMENDATION_TAG_LABELS,
    ApplicationStatus,
)
from app.models.feedback import Feedback
from app.models.leaderboard import StudyClass
from app.models.recommendation import LeaderRecommendation
from app.models.study import Study
from app.models.update import Update
from app.models.user import User
from app.schemas.admin_application import AdminApplicationAdminItem
from app.schemas.analytics import AnalyticsOverviewResponse, CampusVisitCount, FeatureVisitCount, UserVisitCount
from app.schemas.curriculum import CurriculumCreateRequest, CurriculumResponse, TopicCreateRequest, TopicResponse
from app.schemas.feedback import FeedbackAdminUpdateRequest, FeedbackAiDraftResponse, FeedbackResponse
from app.schemas.leaderboard import AdminClassResponse, ClassCreateRequest
from app.schemas.recommendation import AdminRecommendationLogItem
from app.schemas.study import StudyListResponse
from app.schemas.update import UpdateCreateRequest, UpdateEditRequest, UpdateResponse
from app.schemas.user import AdminPasswordResetResponse, AdminUserResponse
from app.services.feedback_reviewer import FeedbackReviewerNotConfiguredError, generate_feedback_draft
from app.utils.curriculum_mapper import to_curriculum_response, to_topic_response
from app.utils.feedback_mapper import to_feedback_response
from app.utils.study_mapper import to_study_response

router = APIRouter(prefix="/api/admin", tags=["관리자"], dependencies=[Depends(get_current_admin)])


@router.get("/users", response_model=list[AdminUserResponse], summary="[관리자] 회원 목록 조회")
def list_all_users(db: Session = Depends(get_db)):
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return users


@router.delete("/users/{user_id}", summary="[관리자] 회원 삭제")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "회원을 찾을 수 없습니다.")
    if user.is_main_admin:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "메인 관리자 계정은 삭제할 수 없습니다.")
    db.delete(user)
    db.commit()
    return {"message": "회원이 삭제되었습니다."}


@router.post(
    "/users/{user_id}/reset-password",
    response_model=AdminPasswordResetResponse,
    summary="[관리자] 회원 비밀번호 재설정 (임시 비밀번호 발급)",
)
def reset_user_password(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "회원을 찾을 수 없습니다.")

    temporary_password = generate_temporary_password()
    user.hashed_password = hash_password(temporary_password)
    db.commit()
    return AdminPasswordResetResponse(temporary_password=temporary_password)


@router.get("/studies", response_model=StudyListResponse, summary="[관리자] 스터디 목록 조회")
def list_all_studies(db: Session = Depends(get_db)):
    query = select(Study).options(
        selectinload(Study.creator), selectinload(Study.members), selectinload(Study.days)
    ).order_by(Study.created_at.desc())
    studies = db.scalars(query).unique().all()
    items = [to_study_response(s) for s in studies]
    return StudyListResponse(total=len(items), items=items)


@router.delete("/studies/{study_id}", summary="[관리자] 스터디 삭제")
def delete_study(study_id: int, db: Session = Depends(get_db)):
    study = db.get(Study, study_id)
    if study is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "스터디를 찾을 수 없습니다.")
    db.delete(study)
    db.commit()
    return {"message": "스터디가 삭제되었습니다."}


@router.get(
    "/leader-recommendations",
    response_model=list[AdminRecommendationLogItem],
    summary="[관리자] 모임장 추천/포인트 지급 내역 (추천자 정보는 포함되지 않음)",
)
def list_leader_recommendations(db: Session = Depends(get_db)):
    query = (
        select(LeaderRecommendation)
        .options(selectinload(LeaderRecommendation.leader), selectinload(LeaderRecommendation.study))
        .order_by(LeaderRecommendation.created_at.desc())
    )
    rows = db.scalars(query).all()
    return [
        AdminRecommendationLogItem(
            id=r.id,
            leader_name=r.leader.name,
            leader_username=r.leader.username,
            study_name=r.study.name,
            points_given=r.points_given,
            reason_tag=r.reason_tag,
            reason_label=RECOMMENDATION_TAG_LABELS.get(r.reason_tag, r.reason_tag),
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/updates", response_model=list[UpdateResponse], summary="[관리자] 업데이트 공지 전체 이력 조회")
def list_all_updates(db: Session = Depends(get_db)):
    return db.scalars(select(Update).order_by(Update.created_at.desc())).all()


@router.post(
    "/updates",
    response_model=UpdateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[관리자] 업데이트 공지 작성",
)
def create_update(payload: UpdateCreateRequest, db: Session = Depends(get_db)):
    update = Update(
        title=payload.title,
        content=payload.content,
        version=payload.version,
        category=payload.category.value,
        is_active=payload.is_active,
    )
    db.add(update)
    db.commit()
    db.refresh(update)
    return update


@router.put("/updates/{update_id}", response_model=UpdateResponse, summary="[관리자] 업데이트 공지 수정")
def edit_update(update_id: int, payload: UpdateEditRequest, db: Session = Depends(get_db)):
    update = db.get(Update, update_id)
    if update is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "업데이트 공지를 찾을 수 없습니다.")

    if payload.title is not None:
        update.title = payload.title
    if payload.content is not None:
        update.content = payload.content
    if payload.version is not None:
        update.version = payload.version
    if payload.category is not None:
        update.category = payload.category.value
    if payload.is_active is not None:
        update.is_active = payload.is_active

    db.commit()
    db.refresh(update)
    return update


@router.delete("/updates/{update_id}", summary="[관리자] 업데이트 공지 삭제")
def delete_update(update_id: int, db: Session = Depends(get_db)):
    update = db.get(Update, update_id)
    if update is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "업데이트 공지를 찾을 수 없습니다.")
    db.delete(update)
    db.commit()
    return {"message": "업데이트 공지가 삭제되었습니다."}


@router.post(
    "/curricula",
    response_model=CurriculumResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[관리자] 교육과정 생성",
)
def create_curriculum(payload: CurriculumCreateRequest, db: Session = Depends(get_db)):
    curriculum = Curriculum(title=payload.title, description=payload.description)
    db.add(curriculum)
    db.commit()
    db.refresh(curriculum)
    return to_curriculum_response(curriculum)


@router.delete("/curricula/{curriculum_id}", summary="[관리자] 교육과정 삭제")
def delete_curriculum(curriculum_id: int, db: Session = Depends(get_db)):
    curriculum = db.get(Curriculum, curriculum_id)
    if curriculum is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "교육과정을 찾을 수 없습니다.")
    db.delete(curriculum)
    db.commit()
    return {"message": "교육과정이 삭제되었습니다."}


def _to_admin_class_response(study_class: StudyClass, member_count: int) -> AdminClassResponse:
    return AdminClassResponse(
        id=study_class.id,
        campus=study_class.campus,
        campus_label=CAMPUS_LABELS.get(study_class.campus, study_class.campus),
        name=study_class.name,
        member_count=member_count,
    )


@router.get("/classes", response_model=list[AdminClassResponse], summary="[관리자] 반 목록 조회 (전체 캠퍼스)")
def list_classes_for_admin(db: Session = Depends(get_db)):
    classes = db.execute(select(StudyClass).order_by(StudyClass.campus, StudyClass.name)).scalars().all()
    counts = dict(
        db.execute(select(User.class_id, func.count()).group_by(User.class_id)).all()
    )
    return [_to_admin_class_response(c, counts.get(c.id, 0)) for c in classes]


@router.post(
    "/classes",
    response_model=AdminClassResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[관리자] 반 생성",
)
def create_class(payload: ClassCreateRequest, db: Session = Depends(get_db)):
    exists = db.scalar(
        select(StudyClass).where(StudyClass.campus == payload.campus.value, StudyClass.name == payload.name)
    )
    if exists is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 존재하는 반입니다.")

    study_class = StudyClass(campus=payload.campus.value, name=payload.name)
    db.add(study_class)
    db.commit()
    db.refresh(study_class)
    return _to_admin_class_response(study_class, member_count=0)


@router.delete("/classes/{class_id}", summary="[관리자] 반 삭제")
def delete_class(class_id: int, db: Session = Depends(get_db)):
    study_class = db.get(StudyClass, class_id)
    if study_class is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "반을 찾을 수 없습니다.")
    db.delete(study_class)
    db.commit()
    return {"message": "반이 삭제되었습니다. 소속되어 있던 회원들은 반 미배정 상태가 됩니다."}


@router.post(
    "/curricula/{curriculum_id}/topics",
    response_model=TopicResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[관리자] 단원 생성",
)
def create_topic(curriculum_id: int, payload: TopicCreateRequest, db: Session = Depends(get_db)):
    curriculum = db.get(Curriculum, curriculum_id)
    if curriculum is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "교육과정을 찾을 수 없습니다.")

    topic = Topic(curriculum_id=curriculum_id, title=payload.title, order_index=payload.order)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return to_topic_response(topic, message_count=0)


@router.delete("/topics/{topic_id}", summary="[관리자] 단원 삭제")
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "단원을 찾을 수 없습니다.")
    db.delete(topic)
    db.commit()
    return {"message": "단원이 삭제되었습니다."}


def _to_application_admin_item(application: AdminApplication) -> AdminApplicationAdminItem:
    return AdminApplicationAdminItem(
        id=application.id,
        applicant_name=application.user.name,
        applicant_username=application.user.username,
        reason=application.reason,
        status=application.status,
        status_label=APPLICATION_STATUS_LABELS.get(application.status, application.status),
        created_at=application.created_at,
        reviewed_at=application.reviewed_at,
        reviewed_by_name=application.reviewed_by.name if application.reviewed_by else None,
    )


@router.get(
    "/admin-applications",
    response_model=list[AdminApplicationAdminItem],
    summary="[관리자] 관리자 권한 신청 목록 조회",
)
def list_admin_applications(db: Session = Depends(get_db)):
    query = (
        select(AdminApplication)
        .options(selectinload(AdminApplication.user), selectinload(AdminApplication.reviewed_by))
        .order_by(AdminApplication.created_at.desc())
    )
    applications = db.scalars(query).all()
    return [_to_application_admin_item(a) for a in applications]


@router.post(
    "/admin-applications/{application_id}/approve",
    response_model=AdminApplicationAdminItem,
    summary="[메인 관리자 전용] 관리자 권한 신청 승인 (승인 시 부관리자로 전환)",
)
def approve_admin_application(
    application_id: int,
    current_user: User = Depends(get_current_main_admin),
    db: Session = Depends(get_db),
):
    application = db.get(AdminApplication, application_id)
    if application is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "신청 내역을 찾을 수 없습니다.")
    if application.status != ApplicationStatus.PENDING.value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 처리된 신청입니다.")

    applicant = db.get(User, application.user_id)
    applicant.is_admin = True  # 승인된 신청자는 부관리자(is_main_admin=False)가 된다.

    application.status = ApplicationStatus.APPROVED.value
    application.reviewed_at = datetime.now(timezone.utc)
    application.reviewed_by_id = current_user.id

    db.commit()
    db.refresh(application)
    return _to_application_admin_item(application)


@router.post(
    "/admin-applications/{application_id}/reject",
    response_model=AdminApplicationAdminItem,
    summary="[메인 관리자 전용] 관리자 권한 신청 거절",
)
def reject_admin_application(
    application_id: int,
    current_user: User = Depends(get_current_main_admin),
    db: Session = Depends(get_db),
):
    application = db.get(AdminApplication, application_id)
    if application is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "신청 내역을 찾을 수 없습니다.")
    if application.status != ApplicationStatus.PENDING.value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 처리된 신청입니다.")

    application.status = ApplicationStatus.REJECTED.value
    application.reviewed_at = datetime.now(timezone.utc)
    application.reviewed_by_id = current_user.id

    db.commit()
    db.refresh(application)
    return _to_application_admin_item(application)


@router.get(
    "/analytics/overview",
    response_model=AnalyticsOverviewResponse,
    summary="[관리자] 이용 분석 (캠퍼스별/기능별/회원별 방문 현황)",
)
def get_analytics_overview(db: Session = Depends(get_db)):
    total_visits = db.scalar(select(func.count()).select_from(PageVisit)) or 0

    campus_rows = db.execute(
        select(User.campus, func.count())
        .select_from(PageVisit)
        .join(User, User.id == PageVisit.user_id)
        .group_by(User.campus)
    ).all()
    campus_counts = {campus: count for campus, count in campus_rows}
    by_campus = [
        CampusVisitCount(campus=code, label=label, visit_count=campus_counts.get(code, 0))
        for code, label in CAMPUS_LABELS.items()
    ]

    feature_rows = db.execute(
        select(PageVisit.feature, func.count()).group_by(PageVisit.feature)
    ).all()
    feature_counts = {feature: count for feature, count in feature_rows}
    by_feature = sorted(
        (
            FeatureVisitCount(feature=code, label=label, visit_count=feature_counts.get(code, 0))
            for code, label in APP_FEATURE_LABELS.items()
        ),
        key=lambda item: item.visit_count,
        reverse=True,
    )

    user_rows = db.execute(
        select(User.id, User.name, User.campus, func.count(), func.max(PageVisit.created_at))
        .select_from(PageVisit)
        .join(User, User.id == PageVisit.user_id)
        .group_by(User.id, User.name, User.campus)
        .order_by(func.count().desc())
        .limit(50)
    ).all()
    top_users = [
        UserVisitCount(
            user_id=uid,
            name=name,
            campus_label=CAMPUS_LABELS.get(campus, campus),
            visit_count=count,
            last_visited_at=last_visited_at,
        )
        for uid, name, campus, count, last_visited_at in user_rows
    ]

    return AnalyticsOverviewResponse(
        total_visits=total_visits, by_campus=by_campus, by_feature=by_feature, top_users=top_users
    )


@router.patch(
    "/feedback/{feedback_id}",
    response_model=FeedbackResponse,
    summary="[관리자] 후기/건의 답변 작성/수정 및 해결 상태 변경",
)
def update_feedback_admin(
    feedback_id: int,
    payload: FeedbackAdminUpdateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    item = db.get(Feedback, feedback_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "게시글을 찾을 수 없습니다.")

    if payload.admin_reply is not None:
        item.admin_reply = payload.admin_reply
        item.replied_at = datetime.now(timezone.utc)
    if payload.is_resolved is not None:
        item.is_resolved = payload.is_resolved

    db.commit()
    db.refresh(item)
    return to_feedback_response(item, current_admin)


@router.post(
    "/feedback/{feedback_id}/ai-draft",
    response_model=FeedbackAiDraftResponse,
    summary="[관리자] 후기/건의 AI 현실성 검토 및 답변 초안 생성",
)
def generate_feedback_ai_draft(feedback_id: int, db: Session = Depends(get_db)):
    item = db.get(Feedback, feedback_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "게시글을 찾을 수 없습니다.")

    category_label = FEEDBACK_CATEGORY_LABELS.get(item.category, item.category)
    try:
        draft = generate_feedback_draft(item, category_label)
    except FeedbackReviewerNotConfiguredError:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "AI 초안 생성 기능이 설정되지 않았습니다. 서버 관리자에게 ANTHROPIC_API_KEY 설정을 요청하세요.",
        )
    except Exception:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "AI 초안 생성에 실패했습니다. 잠시 후 다시 시도해주세요."
        )

    return FeedbackAiDraftResponse(
        feasibility_note=draft.feasibility_note,
        draft_reply=draft.draft_reply,
        suggested_resolved=draft.suggested_resolved,
    )
