"""Google 소셜 로그인/가입 API 테스트. 실제 구글 서버 대신 토큰 검증 함수를 모킹한다."""
import app.routers.auth as auth_router
import app.routers.users as users_router
from app.core.google_oauth import GoogleProfile


def _mock_google_profile(monkeypatch, *, google_id="g-123", email="new@gmail.com", name="새회원", picture="https://pic"):
    def fake_verify(id_token: str) -> GoogleProfile:
        return GoogleProfile(google_id=google_id, email=email, name=name, picture=picture)

    monkeypatch.setattr(auth_router, "verify_google_id_token", fake_verify)


def _mock_google_profile_for_linking(
    monkeypatch, *, google_id="g-123", email="new@gmail.com", name="새회원", picture="https://pic"
):
    def fake_verify(id_token: str) -> GoogleProfile:
        return GoogleProfile(google_id=google_id, email=email, name=name, picture=picture)

    monkeypatch.setattr(users_router, "verify_google_id_token", fake_verify)


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
    return res.json()["access_token"]


def test_new_google_user_needs_profile_completion(client, monkeypatch):
    _mock_google_profile(monkeypatch, email="brandnew@gmail.com")

    res = client.post("/api/auth/google", json={"id_token": "fake"})
    assert res.status_code == 200
    body = res.json()
    assert body["needs_profile_completion"] is True
    assert body["pending_token"]
    assert body["email"] == "brandnew@gmail.com"


def test_complete_signup_creates_user_without_password(client, monkeypatch):
    _mock_google_profile(monkeypatch, email="complete@gmail.com", name="구글유저")

    login_res = client.post("/api/auth/google", json={"id_token": "fake"})
    pending_token = login_res.json()["pending_token"]

    res = client.post(
        "/api/auth/google/complete-signup",
        json={"pending_token": pending_token, "skala_id": "SKALA-G1", "campus": "ULSAN", "interests": ["SQLD"]},
    )
    assert res.status_code == 201
    access_token = res.json()["access_token"]

    me_res = client.get("/api/users/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == "complete@gmail.com"
    assert profile["campus"] == "ULSAN"
    assert profile["has_password"] is False
    assert profile["picture_url"] == "https://pic"


def test_existing_google_user_logs_in_directly(client, monkeypatch):
    _mock_google_profile(monkeypatch, google_id="g-repeat", email="repeat@gmail.com")

    first = client.post("/api/auth/google", json={"id_token": "fake"})
    pending_token = first.json()["pending_token"]
    client.post(
        "/api/auth/google/complete-signup",
        json={"pending_token": pending_token, "skala_id": "SKALA-G2", "campus": "PANGYO", "interests": []},
    )

    second = client.post("/api/auth/google", json={"id_token": "fake"})
    assert second.status_code == 200
    assert second.json()["needs_profile_completion"] is False
    assert second.json()["access_token"]


def test_google_login_links_existing_password_account_by_email(client, monkeypatch):
    _signup_and_login(client, username="linked1", email="linkme@skala.com", skala_id="SKALA-LINK1")
    _mock_google_profile(monkeypatch, email="linkme@skala.com")

    res = client.post("/api/auth/google", json={"id_token": "fake"})
    assert res.status_code == 200
    assert res.json()["needs_profile_completion"] is False
    assert res.json()["access_token"]


def test_google_only_account_cannot_password_login(client, monkeypatch):
    _mock_google_profile(monkeypatch, email="onlygoogle@gmail.com")
    first = client.post("/api/auth/google", json={"id_token": "fake"})
    pending_token = first.json()["pending_token"]
    client.post(
        "/api/auth/google/complete-signup",
        json={"pending_token": pending_token, "skala_id": "SKALA-G3", "campus": "GWANGJU", "interests": []},
    )

    # 이메일 아이디 부분이 username이 되므로 "onlygoogle"로 로그인 시도
    res = client.post("/api/auth/login", json={"username": "onlygoogle", "password": "anything"})
    assert res.status_code == 401


def test_google_only_account_can_set_initial_password_and_then_login(client, monkeypatch):
    _mock_google_profile(monkeypatch, email="setpw@gmail.com")
    first = client.post("/api/auth/google", json={"id_token": "fake"})
    pending_token = first.json()["pending_token"]
    complete_res = client.post(
        "/api/auth/google/complete-signup",
        json={"pending_token": pending_token, "skala_id": "SKALA-G4", "campus": "PANGYO", "interests": []},
    )
    access_token = complete_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 비밀번호가 없으므로 current_password 없이도 새 비밀번호를 설정할 수 있어야 한다.
    set_pw_res = client.post(
        "/api/users/me/change-password",
        json={"current_password": "", "new_password": "brandnewpassword"},
        headers=headers,
    )
    assert set_pw_res.status_code == 200

    login_res = client.post("/api/auth/login", json={"username": "setpw", "password": "brandnewpassword"})
    assert login_res.status_code == 200


def test_google_only_account_can_delete_without_password(client, monkeypatch):
    _mock_google_profile(monkeypatch, email="deleteme@gmail.com")
    first = client.post("/api/auth/google", json={"id_token": "fake"})
    pending_token = first.json()["pending_token"]
    complete_res = client.post(
        "/api/auth/google/complete-signup",
        json={"pending_token": pending_token, "skala_id": "SKALA-G5", "campus": "PANGYO", "interests": []},
    )
    access_token = complete_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    res = client.request("DELETE", "/api/users/me", json={}, headers=headers)
    assert res.status_code == 200


def test_link_google_account_to_existing_password_account(client, monkeypatch):
    token = _signup_and_login(client, username="linkme1", email="linkme1@skala.com", skala_id="SKALA-LK1")
    headers = {"Authorization": f"Bearer {token}"}

    _mock_google_profile_for_linking(monkeypatch, google_id="g-link-1", email="personal@gmail.com")
    res = client.post("/api/users/me/link-google", json={"id_token": "fake"}, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["google_linked"] is True
    assert body["picture_url"] == "https://pic"
    # 기존 계정 이메일은 그대로 유지되어야 한다 (구글 이메일로 덮어쓰지 않는다).
    assert body["email"] == "linkme1@skala.com"


def test_link_google_account_conflict_when_already_linked_elsewhere(client, monkeypatch):
    token_a = _signup_and_login(client, username="linka", email="linka@skala.com", skala_id="SKALA-LKA")
    token_b = _signup_and_login(client, username="linkb", email="linkb@skala.com", skala_id="SKALA-LKB")

    _mock_google_profile_for_linking(monkeypatch, google_id="g-shared", email="shared@gmail.com")
    first = client.post(
        "/api/users/me/link-google", json={"id_token": "fake"}, headers={"Authorization": f"Bearer {token_a}"}
    )
    assert first.status_code == 200

    second = client.post(
        "/api/users/me/link-google", json={"id_token": "fake"}, headers={"Authorization": f"Bearer {token_b}"}
    )
    assert second.status_code == 409


def test_link_google_account_requires_authentication(client):
    res = client.post("/api/users/me/link-google", json={"id_token": "fake"})
    assert res.status_code == 401
