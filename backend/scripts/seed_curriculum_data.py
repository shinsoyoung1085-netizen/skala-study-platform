"""
교육과정/단원/Q&A/정보공유 기능 데모용 시드 데이터 스크립트.

사용법:
    python scripts/seed_curriculum_data.py

실제 가입 계정은 건드리지 않고, 전용 데모 계정(demo_backend1~3)을 새로 만들어
교육과정에 배정한다. 이미 생성된 항목은 건너뛰므로 여러 번 실행해도 안전하다.
"""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.core.security import hash_password  # noqa: E402
from app.db.database import SessionLocal  # noqa: E402
from app.models.curriculum import Curriculum, Topic  # noqa: E402
from app.models.post import Post, PostTag  # noqa: E402
from app.models.topic_message import TopicMessage  # noqa: E402
from app.models.user import User, UserSkill  # noqa: E402

DEMO_PASSWORD = "demo1234!"


def get_or_create_curriculum(db, title: str, description: str) -> Curriculum:
    curriculum = db.query(Curriculum).filter(Curriculum.title == title).first()
    if curriculum:
        return curriculum
    curriculum = Curriculum(title=title, description=description)
    db.add(curriculum)
    db.flush()
    print(f"커리큘럼 '{title}' 생성됨")
    return curriculum


def get_or_create_topic(db, curriculum: Curriculum, title: str, order: int) -> Topic:
    topic = (
        db.query(Topic)
        .filter(Topic.curriculum_id == curriculum.id, Topic.title == title)
        .first()
    )
    if topic:
        return topic
    topic = Topic(curriculum_id=curriculum.id, title=title, order_index=order)
    db.add(topic)
    db.flush()
    print(f"  단원 '{title}' 생성됨")
    return topic


def get_or_create_demo_user(db, username: str, name: str, skala_id: str, curriculum: Curriculum) -> User:
    user = db.query(User).filter(User.username == username).first()
    if user:
        return user
    user = User(
        name=name,
        username=username,
        email=f"{username}@skala-demo.com",
        hashed_password=hash_password(DEMO_PASSWORD),
        skala_id=skala_id,
        campus="PANGYO",
        curriculum_id=curriculum.id,
    )
    db.add(user)
    db.flush()
    print(f"  데모 계정 '{username}' 생성됨")
    return user


def set_skill(db, user: User, category: str, level: str) -> None:
    existing = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == user.id, UserSkill.category == category)
        .first()
    )
    if existing:
        existing.level = level
        return
    db.add(UserSkill(user_id=user.id, category=category, level=level))


def seed() -> None:
    db = SessionLocal()
    try:
        backend = get_or_create_curriculum(db, "백엔드 1기", "SKALA 백엔드 1기 교육과정")
        get_or_create_curriculum(db, "프론트엔드 1기", "SKALA 프론트엔드 1기 교육과정")
        db.flush()

        os_topic = get_or_create_topic(db, backend, "운영체제", 1)
        get_or_create_topic(db, backend, "네트워크", 2)
        get_or_create_topic(db, backend, "데이터베이스", 3)
        get_or_create_topic(db, backend, "자료구조", 4)
        db.flush()

        demo1 = get_or_create_demo_user(db, "demo_backend1", "데모유저1", "SKALA-DEMO-0001", backend)
        demo2 = get_or_create_demo_user(db, "demo_backend2", "데모유저2", "SKALA-DEMO-0002", backend)
        demo3 = get_or_create_demo_user(db, "demo_backend3", "데모유저3", "SKALA-DEMO-0003", backend)
        db.flush()

        # 전문가 추천 UI가 시드 직후 바로 동작하도록 분야별로 HIGH 보유자를 최소 1명씩 만든다.
        set_skill(db, demo1, "운영체제", "HIGH")
        set_skill(db, demo1, "네트워크", "MEDIUM")
        set_skill(db, demo2, "네트워크", "HIGH")
        set_skill(db, demo2, "데이터베이스", "MEDIUM")
        set_skill(db, demo3, "자료구조", "HIGH")
        set_skill(db, demo3, "운영체제", "LOW")
        db.flush()

        if not db.query(Post).filter(Post.curriculum_id == backend.id).first():
            posts_data = [
                (demo1, "정보처리기사 실기 준비 꿀팁 공유합니다. 기출문제 위주로 보세요!", ["꿀팁", "자격증"]),
                (demo2, "이번 주 스터디룸 예약 공지입니다.", ["공지"]),
                (demo3, "운영체제 1주차 과제 관련 질문 있으신 분 계신가요?", ["질문", "운영체제"]),
            ]
            for author, content, tags in posts_data:
                post = Post(user_id=author.id, curriculum_id=backend.id, content=content)
                db.add(post)
                db.flush()
                for tag in tags:
                    db.add(PostTag(post_id=post.id, tag=tag))
            print("게시글 시드 데이터 생성됨")

        if not db.query(TopicMessage).filter(TopicMessage.topic_id == os_topic.id).first():
            q1 = TopicMessage(
                topic_id=os_topic.id,
                user_id=demo2.id,
                content="프로세스와 스레드의 차이가 정확히 뭔가요?",
                is_question=True,
                category="운영체제",
            )
            db.add(q1)
            db.flush()

            a1 = TopicMessage(
                topic_id=os_topic.id,
                user_id=demo1.id,
                content="프로세스는 독립된 메모리 공간을 갖고, 스레드는 프로세스 내 자원을 공유하는 실행 흐름이에요.",
                reply_to_id=q1.id,
            )
            db.add(a1)

            a2 = TopicMessage(
                topic_id=os_topic.id,
                user_id=demo3.id,
                content="+ 컨텍스트 스위칭 비용도 스레드가 프로세스보다 훨씬 저렴합니다.",
                reply_to_id=q1.id,
                is_accepted=True,
            )
            db.add(a2)

            q2 = TopicMessage(
                topic_id=os_topic.id,
                user_id=demo3.id,
                content="가상 메모리는 왜 쓰는 건가요?",
                is_question=True,
                category="운영체제",
            )
            db.add(q2)
            db.flush()

            a3 = TopicMessage(
                topic_id=os_topic.id,
                user_id=demo1.id,
                content="물리 메모리보다 큰 프로그램을 실행할 수 있게 해주고, 프로세스별 메모리 공간을 격리해줘요.",
                reply_to_id=q2.id,
            )
            db.add(a3)

            db.add(
                TopicMessage(topic_id=os_topic.id, user_id=demo2.id, content="다들 화이팅입니다!")
            )
            print("Q&A 채팅 시드 데이터 생성됨 (질문 1건 해결, 1건 미해결)")

        db.commit()
        print("\n시드 완료.")
        print(f"데모 계정 로그인 정보: demo_backend1~3 / 비밀번호: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
