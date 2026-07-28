"""
관리자 계정을 생성하는 커맨드라인 스크립트.

사용법:
    python scripts/create_admin.py

이미 같은 아이디의 회원이 존재하면 해당 회원을 관리자로 승격시킨다.
"""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.core.security import hash_password  # noqa: E402
from app.db.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402


def create_admin(name: str, username: str, email: str, password: str, skala_id: str) -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            existing.is_admin = True
            existing.is_main_admin = True
            db.commit()
            print(f"기존 회원 '{username}'을(를) 메인 관리자로 승격했습니다.")
            return

        admin = User(
            name=name,
            username=username,
            email=email,
            hashed_password=hash_password(password),
            skala_id=skala_id,
            campus="PANGYO",
            is_admin=True,
            is_main_admin=True,
        )
        db.add(admin)
        db.commit()
        print(f"메인 관리자 계정 '{username}'이(가) 생성되었습니다.")
    finally:
        db.close()


if __name__ == "__main__":
    create_admin(
        name="관리자",
        username="admin",
        email="admin@skala.com",
        password="admin1234!",
        skala_id="SKALA-ADMIN-0000",
    )
