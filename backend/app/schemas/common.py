"""
여러 스키마에서 공통으로 사용하는 선택지(Enum) 응답용 스키마.
"""
from pydantic import BaseModel

from app.models.enums import CATEGORY_LABELS, DAY_LABELS, LOCATION_LABELS


class OptionItem(BaseModel):
    """드롭다운/체크박스 선택지 하나를 표현 (코드 + 한글 라벨)."""

    code: str
    label: str


def build_options(labels: dict[str, str]) -> list[OptionItem]:
    return [OptionItem(code=code, label=label) for code, label in labels.items()]


CATEGORY_OPTIONS = build_options(CATEGORY_LABELS)
DAY_OPTIONS = build_options(DAY_LABELS)
LOCATION_OPTIONS = build_options(LOCATION_LABELS)
