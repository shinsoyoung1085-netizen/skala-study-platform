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


class PointReason(str, Enum):
    """주간 리더보드 포인트 지급 사유 (point_transactions.reason)."""

    WEEKLY_INDIVIDUAL = "WEEKLY_INDIVIDUAL"  # Tier1: 반 내 개인 1위
    WEEKLY_CLASS = "WEEKLY_CLASS"  # Tier2: 캠퍼스 내 우승 반 소속
    WEEKLY_CAMPUS = "WEEKLY_CAMPUS"  # Tier3: 전체 우승 캠퍼스 소속


# 주간 리더보드: 하루 최대 인정 공부시간(초). 수업시간 9~18시 기준 6시간으로 캡핑(어뷰징 방지).
MAX_DAILY_STUDY_SECONDS = 6 * 3600

# 주간 리더보드: 이 시간(초) 미만이면 반/캠퍼스가 이겨도 포인트 0 (프리라이더 방지 자격 조건).
# 초기엔 사용률이 낮아 0으로 임시 비활성화 - 사용량이 늘면 10 * 3600 등으로 복원해서 다시 켠다.
WEEKLY_QUALIFICATION_SECONDS = 0

# 주간 리더보드 티어별 지급 포인트.
TIER_POINTS: dict[str, int] = {
    PointReason.WEEKLY_INDIVIDUAL: 500,
    PointReason.WEEKLY_CLASS: 300,
    PointReason.WEEKLY_CAMPUS: 100,
}


class SkillLevel(str, Enum):
    """분야별 이해도 수준 (역량 프로필, 전문가 추천 매칭에 사용)."""

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AppFeature(str, Enum):
    """방문 추적 대상이 되는 화면(기능) 키. 프론트 라우트와 1:1로 매핑된다."""

    HOME = "HOME"
    STUDIES = "STUDIES"
    MY_STUDIES = "MY_STUDIES"
    CURRICULUM = "CURRICULUM"
    FEED = "FEED"
    FEEDBACK = "FEEDBACK"
    MYPAGE = "MYPAGE"
    ADMIN = "ADMIN"


class FeedbackCategory(str, Enum):
    """익명 후기/건의 게시글의 분류 (관리자 분류/필터용)."""

    PRAISE = "PRAISE"
    SUGGESTION = "SUGGESTION"
    BUG = "BUG"
    ETC = "ETC"


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

APP_FEATURE_LABELS: dict[str, str] = {
    AppFeature.HOME: "홈",
    AppFeature.STUDIES: "스터디",
    AppFeature.MY_STUDIES: "내 스터디",
    AppFeature.CURRICULUM: "교육과정",
    AppFeature.FEED: "정보공유",
    AppFeature.FEEDBACK: "후기/건의",
    AppFeature.MYPAGE: "마이페이지",
    AppFeature.ADMIN: "관리자",
}

FEEDBACK_CATEGORY_LABELS: dict[str, str] = {
    FeedbackCategory.PRAISE: "칭찬",
    FeedbackCategory.SUGGESTION: "건의",
    FeedbackCategory.BUG: "버그 제보",
    FeedbackCategory.ETC: "기타",
}
