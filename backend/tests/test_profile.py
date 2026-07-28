"""마이페이지 정보 수정 / 비밀번호 변경 API 테스트."""


def _signup_and_login(client, username="hong123", email="hong@skala.com", skala_id="SKALA-0001"):
    client.post(
        "/api/auth/signup",
        json={
            "name": "홍길동",
            "username": username,
            "email": email,
            "password": "password123",
            "skala_id": skala_id,
            "campus": "PANGYO",
            "interests": [],
        },
    )
    res = client.post("/api/auth/login", json={"username": username, "password": "password123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_update_campus(client):
    headers = _signup_and_login(client)
    res = client.patch("/api/users/me", json={"campus": "ULSAN"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["campus"] == "ULSAN"
    assert res.json()["campus_label"] == "울산"


def test_update_username_and_email(client):
    headers = _signup_and_login(client)
    res = client.patch(
        "/api/users/me", json={"username": "newname", "email": "new@skala.com"}, headers=headers
    )
    assert res.status_code == 200
    assert res.json()["username"] == "newname"
    assert res.json()["email"] == "new@skala.com"


def test_update_username_rejects_duplicate(client):
    _signup_and_login(client, username="taken1", email="taken1@skala.com", skala_id="SKALA-A")
    headers = _signup_and_login(client, username="myid1", email="myid1@skala.com", skala_id="SKALA-B")

    res = client.patch("/api/users/me", json={"username": "taken1"}, headers=headers)
    assert res.status_code == 400


def test_change_password_success_and_wrong_current(client):
    headers = _signup_and_login(client)

    wrong = client.post(
        "/api/users/me/change-password",
        json={"current_password": "wrong-password", "new_password": "newpassword123"},
        headers=headers,
    )
    assert wrong.status_code == 400

    ok = client.post(
        "/api/users/me/change-password",
        json={"current_password": "password123", "new_password": "newpassword123"},
        headers=headers,
    )
    assert ok.status_code == 200

    # 새 비밀번호로 로그인되고, 옛 비밀번호로는 실패해야 한다.
    old_login = client.post("/api/auth/login", json={"username": "hong123", "password": "password123"})
    assert old_login.status_code == 401

    new_login = client.post("/api/auth/login", json={"username": "hong123", "password": "newpassword123"})
    assert new_login.status_code == 200


def test_delete_account_wrong_password_rejected(client):
    headers = _signup_and_login(client)
    res = client.request(
        "DELETE", "/api/users/me", json={"password": "wrong-password"}, headers=headers
    )
    assert res.status_code == 400


def test_delete_account_success_and_login_fails_after(client):
    headers = _signup_and_login(client)
    res = client.request("DELETE", "/api/users/me", json={"password": "password123"}, headers=headers)
    assert res.status_code == 200

    login_res = client.post("/api/auth/login", json={"username": "hong123", "password": "password123"})
    assert login_res.status_code == 401


def test_admin_cannot_delete_own_account(client, db_session):
    from app.models.user import User

    headers = _signup_and_login(client, username="admin99", email="admin99@skala.com", skala_id="SKALA-ADM")
    user = db_session.query(User).filter(User.username == "admin99").first()
    user.is_admin = True
    db_session.commit()

    res = client.request("DELETE", "/api/users/me", json={"password": "password123"}, headers=headers)
    assert res.status_code == 400
