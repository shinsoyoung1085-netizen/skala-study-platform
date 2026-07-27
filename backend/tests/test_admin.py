"""관리자 회원/스터디 조회 및 삭제 API 테스트."""
from app.db.database import Base
from app.models.user import User


def _signup_and_login(client, username="hong123", skala_id="SKALA-0001"):
    client.post(
        "/api/auth/signup",
        json={
            "name": "홍길동",
            "username": username,
            "email": f"{username}@skala.com",
            "password": "password123",
            "skala_id": skala_id,
            "campus": "PANGYO",
            "interests": [],
        },
    )
    res = client.post("/api/auth/login", json={"username": username, "password": "password123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _promote_to_admin(db_session, username):
    user = db_session.query(User).filter(User.username == username).first()
    user.is_admin = True
    db_session.commit()


def test_non_admin_forbidden(client):
    headers = _signup_and_login(client)
    res = client.get("/api/admin/users", headers=headers)
    assert res.status_code == 403


def test_admin_can_list_and_delete(client, db_session):
    admin_headers = _signup_and_login(client, username="admin1", skala_id="SKALA-ADMIN")
    _promote_to_admin(db_session, "admin1")

    member_headers = _signup_and_login(client, username="member1", skala_id="SKALA-MEMBER1")
    client.post(
        "/api/studies",
        json={
            "name": "테스트 스터디",
            "category": "ETC",
            "capacity": 5,
            "description": "설명",
            "days": ["FRI"],
            "time": "20:00",
            "location": "ONLINE",
            "is_online": True,
        },
        headers=member_headers,
    )

    users_res = client.get("/api/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    assert len(users_res.json()) == 2

    studies_res = client.get("/api/admin/studies", headers=admin_headers)
    assert studies_res.status_code == 200
    assert studies_res.json()["total"] == 1

    study_id = studies_res.json()["items"][0]["id"]
    delete_study_res = client.delete(f"/api/admin/studies/{study_id}", headers=admin_headers)
    assert delete_study_res.status_code == 200

    member_user = db_session.query(User).filter(User.username == "member1").first()
    delete_user_res = client.delete(f"/api/admin/users/{member_user.id}", headers=admin_headers)
    assert delete_user_res.status_code == 200
