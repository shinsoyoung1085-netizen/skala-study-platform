"""모임장 익명 추천 및 포인트 지급 API 테스트."""


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


def _create_study(client, headers, **overrides):
    payload = {
        "name": "토익 스터디",
        "category": "TOEIC",
        "capacity": 5,
        "description": "설명",
        "days": ["MON"],
        "time": "19:00",
        "location": "CAFE",
        "is_online": False,
    }
    payload.update(overrides)
    return client.post("/api/studies", json=payload, headers=headers).json()


def test_non_member_cannot_recommend(client):
    leader_headers = _signup_and_login(client, username="leader1", skala_id="SKALA-L1")
    outsider_headers = _signup_and_login(client, username="outsider1", skala_id="SKALA-O1")
    study = _create_study(client, leader_headers)

    res = client.post(
        f"/api/studies/{study['id']}/recommend-leader",
        json={"reason_tag": "KIND"},
        headers=outsider_headers,
    )
    assert res.status_code == 403


def test_creator_cannot_recommend_self(client):
    leader_headers = _signup_and_login(client, username="leader2", skala_id="SKALA-L2")
    study = _create_study(client, leader_headers)

    res = client.post(
        f"/api/studies/{study['id']}/recommend-leader",
        json={"reason_tag": "KIND"},
        headers=leader_headers,
    )
    assert res.status_code == 400


def test_member_can_recommend_and_leader_gains_points(client):
    leader_headers = _signup_and_login(client, username="leader3", skala_id="SKALA-L3")
    member_headers = _signup_and_login(client, username="member3", skala_id="SKALA-M3")
    study = _create_study(client, leader_headers)
    client.post(f"/api/studies/{study['id']}/join", headers=member_headers)

    res = client.post(
        f"/api/studies/{study['id']}/recommend-leader",
        json={"reason_tag": "LEADERSHIP"},
        headers=member_headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["points_given"] == 50
    assert "리더십" in body["reason_label"]

    points_res = client.get("/api/users/me/points", headers=leader_headers)
    assert points_res.status_code == 200
    assert points_res.json()["points"] == 50
    history = points_res.json()["recommendations_received"]
    assert len(history) == 1
    assert history[0]["study_name"] == "토익 스터디"
    assert history[0]["points_given"] == 50
    # 익명성 보장: 추천자 관련 필드가 응답에 전혀 없어야 한다.
    assert "user_id" not in history[0]
    assert "username" not in history[0]
    assert "recommender" not in history[0]


def test_daily_cooldown_blocks_second_recommendation(client):
    leader_headers = _signup_and_login(client, username="leader4", skala_id="SKALA-L4")
    member_headers = _signup_and_login(client, username="member4", skala_id="SKALA-M4")
    study = _create_study(client, leader_headers)
    client.post(f"/api/studies/{study['id']}/join", headers=member_headers)

    first = client.post(
        f"/api/studies/{study['id']}/recommend-leader",
        json={"reason_tag": "PASSIONATE"},
        headers=member_headers,
    )
    assert first.status_code == 200

    second = client.post(
        f"/api/studies/{study['id']}/recommend-leader",
        json={"reason_tag": "KIND"},
        headers=member_headers,
    )
    assert second.status_code == 400

    # 리더 포인트는 최초 1회분(50)만 반영되어야 한다.
    points_res = client.get("/api/users/me/points", headers=leader_headers)
    assert points_res.json()["points"] == 50


def test_admin_recommendation_log_hides_recommender_identity(client, db_session):
    leader_headers = _signup_and_login(client, username="leader5", skala_id="SKALA-L5")
    member_headers = _signup_and_login(client, username="member5", skala_id="SKALA-M5")
    admin_headers = _signup_and_login(client, username="admin5", skala_id="SKALA-A5")

    from app.models.user import User

    admin_user = db_session.query(User).filter(User.username == "admin5").first()
    admin_user.is_admin = True
    db_session.commit()

    study = _create_study(client, leader_headers)
    client.post(f"/api/studies/{study['id']}/join", headers=member_headers)
    client.post(
        f"/api/studies/{study['id']}/recommend-leader",
        json={"reason_tag": "KIND"},
        headers=member_headers,
    )

    res = client.get("/api/admin/leader-recommendations", headers=admin_headers)
    assert res.status_code == 200
    log = res.json()
    assert len(log) == 1
    entry = log[0]
    assert entry["leader_username"] == "leader5"
    assert entry["points_given"] == 50
    assert "recommender" not in entry
    assert "user_id" not in entry
    assert "username" not in entry or entry.get("username") is None
