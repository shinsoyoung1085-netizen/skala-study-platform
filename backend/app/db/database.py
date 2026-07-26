"""
SQLAlchemy 엔진, 세션, Base 클래스를 정의하는 모듈.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """모든 ORM 모델의 베이스 클래스."""

    pass


def get_db():
    """요청마다 독립적인 DB 세션을 생성하고, 종료 시 자동으로 닫아주는 의존성 함수."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
