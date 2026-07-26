"""
Study ORM 객체를 StudyResponse 스키마로 변환하는 공용 함수.
여러 라우터(목록/상세/내 스터디)에서 중복 없이 재사용한다.
"""
from app.models.enums import CATEGORY_LABELS, DAY_LABELS, LOCATION_LABELS
from app.models.study import Study
from app.schemas.study import StudyResponse
from app.schemas.user import UserSummary

# 요일 정렬 및 "매일"/"주말"/"평일" 판별 기준이 되는 한 주의 순서
_WEEK_ORDER = list(DAY_LABELS.keys())
_WEEKEND = {"SAT", "SUN"}
_WEEKDAYS = set(_WEEK_ORDER) - _WEEKEND


def _build_day_label(day_codes: list[str]) -> str:
    """선택된 요일 조합을 사람이 읽기 좋은 라벨로 변환한다. (예: 매일, 주말, 평일, 월·수·금)"""
    codes = set(day_codes)
    if not codes:
        return "-"
    if codes == set(_WEEK_ORDER):
        return "매일"
    if codes == _WEEKEND:
        return "주말"
    if codes == _WEEKDAYS:
        return "평일"
    ordered = [c for c in _WEEK_ORDER if c in codes]
    return "·".join(DAY_LABELS.get(c, c) for c in ordered)


def to_study_response(study: Study, current_user_id: int | None = None) -> StudyResponse:
    member_ids = {m.user_id for m in study.members}
    day_codes = [d.day_of_week for d in study.days]

    return StudyResponse(
        id=study.id,
        name=study.name,
        category=study.category,
        category_label=CATEGORY_LABELS.get(study.category, study.category),
        capacity=study.capacity,
        description=study.description,
        days=day_codes,
        day_label=_build_day_label(day_codes),
        time=study.time,
        location=study.location,
        location_label=LOCATION_LABELS.get(study.location, study.location),
        is_online=study.is_online,
        exam_date=study.exam_date,
        current_member_count=len(member_ids),
        is_full=len(member_ids) >= study.capacity,
        creator=UserSummary.model_validate(study.creator),
        is_joined=current_user_id in member_ids if current_user_id else False,
        created_at=study.created_at,
    )
