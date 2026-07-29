"""
서비스 전반에서 사용하는 고정 선택지(Enum) 정의.
관심분야/스터디 카테고리, 요일, 장소는 프론트엔드 체크박스·드롭다운과 값이 일치해야 한다.
"""
from enum import Enum


class CategoryCode(str, Enum):
    """관심분야 및 스터디 카테고리 코드 (회원가입 체크박스 / 스터디 생성 카테고리 선택과 공용)."""

    OPIC = "OPIC"
    TOEIC = "TOEIC"
    TOEIC_SPEAKING = "TOEIC_SPEAKING"
    SQLD = "SQLD"
    INFO_PROCESSING_WRITTEN = "INFO_PROCESSING_WRITTEN"
    INFO_PROCESSING_PRACTICAL = "INFO_PROCESSING_PRACTICAL"
    CLASS_STUDY = "CLASS_STUDY"
    ETC = "ETC"


class DayOfWeek(str, Enum):
    MON = "MON"
    TUE = "TUE"
    WED = "WED"
    THU = "THU"
    FRI = "FRI"
    SAT = "SAT"
    SUN = "SUN"


class Location(str, Enum):
    CLASSROOM = "CLASSROOM"
    LOUNGE = "LOUNGE"
    CAFE = "CAFE"
    ONLINE = "ONLINE"
    ETC = "ETC"


class Campus(str, Enum):
    """회원이 소속된 SKALA 캠퍼스."""

    PANGYO = "PANGYO"
    GWANGJU = "GWANGJU"
    ULSAN = "ULSAN"


class RecommendationTag(str, Enum):
    """모임장 익명 추천 시 선택하는 사전 정의 태그 (자유 텍스트 금지 - 익명성 보호 목적)."""

    KIND = "KIND"
    LEADERSHIP = "LEADERSHIP"
    PASSIONATE = "PASSIONATE"


class UpdateCategory(str, Enum):
    """업데이트 공지의 분류."""

    FEATURE = "FEATURE"
    BUGFIX = "BUGFIX"
    IMPROVEMENT = "IMPROVEMENT"
    NOTICE = "NOTICE"


class ApplicationStatus(str, Enum):
    """관리자 권한 신청의 심사 상태."""

    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class SkillLevel(str, Enum):
    """분야별 이해도 수준 (역량 프로필, 전문가 추천 매칭에 사용)."""

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


# 프론트엔드 표시용 한글 라벨 매핑 (API 응답에서 label로 함께 내려줄 때 사용)
CATEGORY_LABELS: dict[str, str] = {
    CategoryCode.OPIC: "OPIC",
    CategoryCode.TOEIC: "TOEIC",
    CategoryCode.TOEIC_SPEAKING: "TOEIC Speaking",
    CategoryCode.SQLD: "SQLD",
    CategoryCode.INFO_PROCESSING_WRITTEN: "정보처리기사 필기",
    CategoryCode.INFO_PROCESSING_PRACTICAL: "정보처리기사 실기",
    CategoryCode.CLASS_STUDY: "수업스터디",
    CategoryCode.ETC: "기타",
}

DAY_LABELS: dict[str, str] = {
    DayOfWeek.MON: "월",
    DayOfWeek.TUE: "화",
    DayOfWeek.WED: "수",
    DayOfWeek.THU: "목",
    DayOfWeek.FRI: "금",
    DayOfWeek.SAT: "토",
    DayOfWeek.SUN: "일",
}

LOCATION_LABELS: dict[str, str] = {
    Location.CLASSROOM: "강의실",
    Location.LOUNGE: "라운지",
    Location.CAFE: "카페",
    Location.ONLINE: "온라인",
    Location.ETC: "기타",
}

CAMPUS_LABELS: dict[str, str] = {
    Campus.PANGYO: "판교",
    Campus.GWANGJU: "광주",
    Campus.ULSAN: "울산",
}

RECOMMENDATION_TAG_LABELS: dict[str, str] = {
    RecommendationTag.KIND: "친절해요 👏",
    RecommendationTag.LEADERSHIP: "리더십이 좋아요 👑",
    RecommendationTag.PASSIONATE: "열정적이에요 🔥",
}

# 추천 1건당 지급되는 고정 포인트 (인플레이션 방지를 위해 소액으로 고정)
RECOMMENDATION_POINTS = 50

# 같은 스터디에 대한 추천은 이 시간(시간 단위)마다 1회만 허용
RECOMMENDATION_COOLDOWN_HOURS = 24

UPDATE_CATEGORY_LABELS: dict[str, str] = {
    UpdateCategory.FEATURE: "신규 기능",
    UpdateCategory.BUGFIX: "버그 수정",
    UpdateCategory.IMPROVEMENT: "개선 사항",
    UpdateCategory.NOTICE: "공지",
}

APPLICATION_STATUS_LABELS: dict[str, str] = {
    ApplicationStatus.PENDING: "심사중",
    ApplicationStatus.APPROVED: "승인됨",
    ApplicationStatus.REJECTED: "거절됨",
}

SKILL_LEVEL_LABELS: dict[str, str] = {
    SkillLevel.HIGH: "상",
    SkillLevel.MEDIUM: "중",
    SkillLevel.LOW: "하",
}
