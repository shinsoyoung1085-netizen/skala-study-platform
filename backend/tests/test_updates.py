"""업데이트 공지 관리 및 조회 API 테스트."""


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


def _make_admin(client, db_session, username="admin1", skala_id="SKALA-ADM1"):
    headers = _signup_and_login(client, username=username, skala_id=skala_id)
    from app.models.user import User

    user = db_session.query(User).filter(User.username == username).first()
    user.is_admin = True
    db_session.commit()
    return headers


def _update_payload(**overrides):
    payload = {
        "title": "v1.1.0 업데이트",
        "content": "요일 다중 선택 기능이 추가되었습니다.",
        "version": "v1.1.0",
        "category": "FEATURE",
        "is_active": True,
    }
    payload.update(overrides)
    return payload


def test_non_admin_cannot_manage_updates(client):
    headers = _signup_and_login(client)
    res = client.post("/api/admin/updates", json=_update_payload(), headers=headers)
    assert res.status_code == 403


def test_admin_can_create_edit_delete_update(client, db_session):
    admin_headers = _make_admin(client, db_session)

    create_res = client.post("/api/admin/updates", json=_update_payload(), headers=admin_headers)
    assert create_res.status_code == 201
    body = create_res.json()
    assert body["category_label"] == "신규 기능"
    update_id = body["id"]

    list_res = client.get("/api/admin/updates", headers=admin_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    edit_res = client.put(
        f"/api/admin/updates/{update_id}", json={"is_active": False}, headers=admin_headers
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["is_active"] is False
    assert edit_res.json()["title"] == "v1.1.0 업데이트"  # 수정 안 한 필드는 그대로

    delete_res = client.delete(f"/api/admin/updates/{update_id}", headers=admin_headers)
    assert delete_res.status_code == 200

    list_after = client.get("/api/admin/updates", headers=admin_headers)
    assert len(list_after.json()) == 0


def test_latest_update_returns_most_recent_active_only(client, db_session):
    admin_headers = _make_admin(client, db_session)
    member_headers = _signup_and_login(client, username="member1", skala_id="SKALA-M1")

    none_res = client.get("/api/updates/latest", headers=member_headers)
    assert none_res.status_code == 200
    assert none_res.json() is None

    client.post(
        "/api/admin/updates", json=_update_payload(title="첫 번째", is_active=False), headers=admin_headers
    )
    still_none = client.get("/api/updates/latest", headers=member_headers)
    assert still_none.json() is None

    second = client.post(
        "/api/admin/updates", json=_update_payload(title="두 번째", is_active=True), headers=admin_headers
    ).json()

    latest_res = client.get("/api/updates/latest", headers=member_headers)
    assert latest_res.status_code == 200
    assert latest_res.json()["id"] == second["id"]
    assert latest_res.json()["title"] == "두 번째"
