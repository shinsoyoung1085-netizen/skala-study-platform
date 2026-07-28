"""전체 가입자 수 / 캠퍼스별 인원 통계 API 테스트."""


def _signup_and_login(client, username="hong123", skala_id="SKALA-0001", campus="PANGYO"):
    client.post(
        "/api/auth/signup",
        json={
            "name": "홍길동",
            "username": username,
            "email": f"{username}@skala.com",
            "password": "password123",
            "skala_id": skala_id,
            "campus": campus,
            "interests": [],
        },
    )
    res = client.post("/api/auth/login", json={"username": username, "password": "password123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_member_stats_counts_by_campus(client):
    headers = _signup_and_login(client, username="stat1", skala_id="SKALA-1", campus="PANGYO")
    _signup_and_login(client, username="stat2", skala_id="SKALA-2", campus="PANGYO")
    _signup_and_login(client, username="stat3", skala_id="SKALA-3", campus="GWANGJU")
    _signup_and_login(client, username="stat4", skala_id="SKALA-4", campus="ULSAN")

    res = client.get("/api/stats/members", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total_members"] == 4

    counts = {c["code"]: c["count"] for c in body["campus_counts"]}
    assert counts["PANGYO"] == 2
    assert counts["GWANGJU"] == 1
    assert counts["ULSAN"] == 1

    labels = {c["code"]: c["label"] for c in body["campus_counts"]}
    assert labels["PANGYO"] == "판교"


def test_member_stats_requires_authentication(client):
    res = client.get("/api/stats/members")
    assert res.status_code == 401
