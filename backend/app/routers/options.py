"""
프론트엔드 드롭다운/체크박스에 사용되는 선택지(카테고리, 요일, 장소) 조회 API.
하드코딩을 피하고 백엔드-프론트엔드 간 값 불일치를 방지하기 위해 제공한다.
"""
from fastapi import APIRouter

from app.schemas.common import CATEGORY_OPTIONS, DAY_OPTIONS, LOCATION_OPTIONS, OptionItem

router = APIRouter(prefix="/api/options", tags=["옵션"])


@router.get("/categories", response_model=list[OptionItem], summary="카테고리(관심분야) 선택지")
def get_categories():
    return CATEGORY_OPTIONS


@router.get("/days", response_model=list[OptionItem], summary="요일 선택지")
def get_days():
    return DAY_OPTIONS


@router.get("/locations", response_model=list[OptionItem], summary="장소 선택지")
def get_locations():
    return LOCATION_OPTIONS
