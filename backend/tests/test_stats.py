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


def test_home_visit_ping_increments_total(client):
    headers = _signup_and_login(client, username="visitor1", skala_id="SKALA-V1", campus="PANGYO")

    first = client.post("/api/stats/visits/ping", headers=headers)
    assert first.status_code == 200
    assert first.json()["total_visits"] == 1

    second = client.post("/api/stats/visits/ping", headers=headers)
    assert second.json()["total_visits"] == 2


def test_home_visit_ping_requires_authentication(client):
    res = client.post("/api/stats/visits/ping")
    assert res.status_code == 401


def test_home_visit_ping_returns_larger_of_home_and_page_visit_totals(client):
    headers = _signup_and_login(client, username="visitor2", skala_id="SKALA-V2", campus="PANGYO")

    # 홈 전용 카운터(1)보다 다른 화면들의 PageVisit 합계가 더 많이 쌓이면, 더 큰 쪽을 보여줘야 한다.
    client.post("/api/stats/track", json={"feature": "STUDIES"}, headers=headers)
    client.post("/api/stats/track", json={"feature": "MY_STUDIES"}, headers=headers)
    client.post("/api/stats/track", json={"feature": "CURRICULUM"}, headers=headers)

    res = client.post("/api/stats/visits/ping", headers=headers)
    assert res.status_code == 200
    assert res.json()["total_visits"] == 3
