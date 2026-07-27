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
