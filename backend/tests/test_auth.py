"""회원가입/로그인/중복확인 API 테스트."""


def _signup_payload(**overrides):
    payload = {
        "name": "홍길동",
        "username": "hong123",
        "email": "hong@skala.com",
        "password": "password123",
        "skala_id": "SKALA-0001",
        "campus": "PANGYO",
        "interests": ["OPIC", "SQLD"],
    }
    payload.update(overrides)
    return payload


def test_signup_success(client):
    res = client.post("/api/auth/signup", json=_signup_payload())
    assert res.status_code == 201
    body = res.json()
    assert body["username"] == "hong123"
    assert set(body["interests"]) == {"OPIC", "SQLD"}
    assert body["joined_study_count"] == 0
    assert body["campus"] == "PANGYO"
    assert body["campus_label"] == "판교"


def test_signup_duplicate_username(client):
    client.post("/api/auth/signup", json=_signup_payload())
    res = client.post("/api/auth/signup", json=_signup_payload(email="other@skala.com", skala_id="SKALA-0002"))
    assert res.status_code == 400
    assert "아이디" in res.json()["detail"]


def test_duplicate_check_endpoints(client):
    client.post("/api/auth/signup", json=_signup_payload())

    assert client.get("/api/auth/check-username", params={"username": "hong123"}).json()["available"] is False
    assert client.get("/api/auth/check-username", params={"username": "newbie"}).json()["available"] is True
    assert client.get("/api/auth/check-email", params={"email": "hong@skala.com"}).json()["available"] is False
    assert client.get("/api/auth/check-skala-id", params={"skala_id": "SKALA-0001"}).json()["available"] is False


def test_login_success_and_failure(client):
    client.post("/api/auth/signup", json=_signup_payload())

    ok = client.post("/api/auth/login", json={"username": "hong123", "password": "password123"})
    assert ok.status_code == 200
    assert "access_token" in ok.json()

    fail = client.post("/api/auth/login", json={"username": "hong123", "password": "wrong-password"})
    assert fail.status_code == 401


def test_me_requires_authentication(client):
    res = client.get("/api/users/me")
    assert res.status_code == 401


def test_find_username_success(client):
    client.post("/api/auth/signup", json=_signup_payload())

    res = client.post(
        "/api/auth/find-username",
        json={"name": "홍길동", "skala_id": "SKALA-0001", "email": "hong@skala.com"},
    )
    assert res.status_code == 200
    assert res.json()["username"] == "hong123"


def test_find_username_no_match(client):
    client.post("/api/auth/signup", json=_signup_payload())

    res = client.post(
        "/api/auth/find-username",
        json={"name": "홍길동", "skala_id": "SKALA-0001", "email": "wrong@skala.com"},
    )
    assert res.status_code == 404


def test_find_password_issues_temporary_password_and_allows_login(client):
    client.post("/api/auth/signup", json=_signup_payload())

    res = client.post(
        "/api/auth/find-password",
        json={
            "username": "hong123",
            "name": "홍길동",
            "skala_id": "SKALA-0001",
            "email": "hong@skala.com",
        },
    )
    assert res.status_code == 200
    temporary_password = res.json()["temporary_password"]
    assert len(temporary_password) > 0

    old_login = client.post("/api/auth/login", json={"username": "hong123", "password": "password123"})
    assert old_login.status_code == 401

    new_login = client.post("/api/auth/login", json={"username": "hong123", "password": temporary_password})
    assert new_login.status_code == 200


def test_find_password_no_match(client):
    client.post("/api/auth/signup", json=_signup_payload())

    res = client.post(
        "/api/auth/find-password",
        json={
            "username": "hong123",
            "name": "홍길동",
            "skala_id": "SKALA-9999",
            "email": "hong@skala.com",
        },
    )
    assert res.status_code == 404
