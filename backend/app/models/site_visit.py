"""
홈 화면 방문수 카운터 관련 모델.
"""
from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class HomeVisitCounter(Base):
    """
    홈 화면 누적 방문수를 집계하는 단일 행(singleton, id=1) 카운터 테이블.
    회원별/일자별 방문 기록이 아니라 서비스 전체의 누적 방문 횟수만 추적한다.
    """

    __tablename__ = "home_visit_counter"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    total_visits: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
