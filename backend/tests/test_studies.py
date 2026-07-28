"""스터디 생성/목록/검색/참여/탈퇴 API 테스트."""


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
            "interests": ["OPIC"],
        },
    )
    res = client.post("/api/auth/login", json={"username": username, "password": "password123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _study_payload(**overrides):
    payload = {
        "name": "토익 900 돌파반",
        "category": "TOEIC",
        "capacity": 2,
        "description": "매주 함께 토익 문제를 풀어요.",
        "days": ["MON"],
        "time": "19:00",
        "location": "CAFE",
        "is_online": False,
    }
    payload.update(overrides)
    return payload


def test_create_and_list_study(client):
    headers = _signup_and_login(client)

    create_res = client.post("/api/studies", json=_study_payload(), headers=headers)
    assert create_res.status_code == 201
    body = create_res.json()
    assert body["name"] == "토익 900 돌파반"
    assert body["current_member_count"] == 1  # 생성자는 자동 참여
    assert body["is_joined"] is True
    assert body["creator"]["username"] == "hong123"

    list_res = client.get("/api/studies", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 1


def test_filter_and_search(client):
    headers = _signup_and_login(client)
    client.post("/api/studies", json=_study_payload(name="토익 스터디", category="TOEIC"), headers=headers)
    client.post("/api/studies", json=_study_payload(name="SQLD 자격증반", category="SQLD", location="ONLINE", is_online=True), headers=headers)

    res_category = client.get("/api/studies", params={"category": "SQLD"}, headers=headers)
    assert res_category.json()["total"] == 1
    assert res_category.json()["items"][0]["name"] == "SQLD 자격증반"

    res_keyword = client.get("/api/studies", params={"keyword": "토익"}, headers=headers)
    assert res_keyword.json()["total"] == 1

    res_online = client.get("/api/studies", params={"is_online": True}, headers=headers)
    assert res_online.json()["total"] == 1
    assert res_online.json()["items"][0]["is_online"] is True


def test_join_and_leave_and_capacity(client):
    owner_headers = _signup_and_login(client, username="owner", skala_id="SKALA-OWNER")
    member_headers = _signup_and_login(client, username="member1", skala_id="SKALA-MEMBER1")

    study = client.post(
        "/api/studies", json=_study_payload(capacity=2), headers=owner_headers
    ).json()
    study_id = study["id"]

    join_res = client.post(f"/api/studies/{study_id}/join", headers=member_headers)
    assert join_res.status_code == 200
    assert join_res.json()["current_member_count"] == 2
    assert join_res.json()["is_full"] is True

    # 정원이 다 찼으므로 세 번째 회원은 참여 불가
    other_headers = _signup_and_login(client, username="member2", skala_id="SKALA-MEMBER2")
    full_res = client.post(f"/api/studies/{study_id}/join", headers=other_headers)
    assert full_res.status_code == 400

    # 탈퇴 후에는 다시 참여 가능
    leave_res = client.delete(f"/api/studies/{study_id}/leave", headers=member_headers)
    assert leave_res.status_code == 200

    rejoin_res = client.post(f"/api/studies/{study_id}/join", headers=other_headers)
    assert rejoin_res.status_code == 200


def test_my_studies(client):
    headers = _signup_and_login(client)
    client.post("/api/studies", json=_study_payload(), headers=headers)

    my_res = client.get("/api/studies/my", headers=headers)
    assert my_res.status_code == 200
    assert my_res.json()["total"] == 1


def test_creator_can_delete_own_study_but_others_cannot(client):
    owner_headers = _signup_and_login(client, username="owner2", skala_id="SKALA-OWNER2")
    other_headers = _signup_and_login(client, username="other2", skala_id="SKALA-OTHER2")

    study = client.post("/api/studies", json=_study_payload(), headers=owner_headers).json()
    study_id = study["id"]
    assert study["is_creator"] is True

    forbidden_res = client.delete(f"/api/studies/{study_id}", headers=other_headers)
    assert forbidden_res.status_code == 403

    delete_res = client.delete(f"/api/studies/{study_id}", headers=owner_headers)
    assert delete_res.status_code == 200

    not_found_res = client.get(f"/api/studies/{study_id}", headers=owner_headers)
    assert not_found_res.status_code == 404


def test_multi_day_selection_and_smart_labels(client):
    headers = _signup_and_login(client)

    mwf = client.post(
        "/api/studies", json=_study_payload(name="월수금반", days=["MON", "WED", "FRI"]), headers=headers
    ).json()
    assert mwf["days"] == ["MON", "WED", "FRI"]
    assert mwf["day_label"] == "월·수·금"

    everyday = client.post(
        "/api/studies",
        json=_study_payload(name="매일반", days=["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
        headers=headers,
    ).json()
    assert everyday["day_label"] == "매일"

    weekend = client.post(
        "/api/studies", json=_study_payload(name="주말반", days=["SAT", "SUN"]), headers=headers
    ).json()
    assert weekend["day_label"] == "주말"

    saturday_only = client.post(
        "/api/studies", json=_study_payload(name="토요일반", days=["SAT"]), headers=headers
    ).json()
    assert saturday_only["day_label"] == "토"

    # 요일 필터: 토요일에 진행되는 스터디는 "매일반"(매일 포함), "주말반", "토요일반"
    res = client.get("/api/studies", params={"day_of_week": "SAT"}, headers=headers)
    names = {item["name"] for item in res.json()["items"]}
    assert names == {"매일반", "주말반", "토요일반"}


def test_creator_can_update_study_but_others_cannot(client):
    owner_headers = _signup_and_login(client, username="editor1", skala_id="SKALA-ED1")
    other_headers = _signup_and_login(client, username="other3", skala_id="SKALA-OT3")
    study = client.post(
        "/api/studies", json=_study_payload(location="CAFE", is_online=False), headers=owner_headers
    ).json()
    study_id = study["id"]

    forbidden_res = client.patch(
        f"/api/studies/{study_id}", json={"location": "ONLINE"}, headers=other_headers
    )
    assert forbidden_res.status_code == 403

    update_res = client.patch(
        f"/api/studies/{study_id}",
        json={"location": "ONLINE", "is_online": True, "name": "온라인 토익반"},
        headers=owner_headers,
    )
    assert update_res.status_code == 200
    body = update_res.json()
    assert body["location"] == "ONLINE"
    assert body["location_label"] == "온라인"
    assert body["is_online"] is True
    assert body["name"] == "온라인 토익반"
    # 수정하지 않은 필드는 그대로 유지되어야 한다.
    assert body["category"] == "TOEIC"


def test_update_study_days_replaces_previous_selection(client):
    owner_headers = _signup_and_login(client, username="editor2", skala_id="SKALA-ED2")
    study = client.post(
        "/api/studies", json=_study_payload(days=["MON"]), headers=owner_headers
    ).json()

    res = client.patch(
        f"/api/studies/{study['id']}", json={"days": ["WED", "FRI"]}, headers=owner_headers
    )
    assert res.status_code == 200
    assert res.json()["days"] == ["WED", "FRI"]


def test_update_study_capacity_cannot_go_below_current_members(client):
    owner_headers = _signup_and_login(client, username="editor3", skala_id="SKALA-ED3")
    member1_headers = _signup_and_login(client, username="joiner3a", skala_id="SKALA-JN3A")
    member2_headers = _signup_and_login(client, username="joiner3b", skala_id="SKALA-JN3B")
    study = client.post(
        "/api/studies", json=_study_payload(capacity=5), headers=owner_headers
    ).json()
    client.post(f"/api/studies/{study['id']}/join", headers=member1_headers)
    client.post(f"/api/studies/{study['id']}/join", headers=member2_headers)
    # 현재 인원 3명(개설자 포함) 상태에서 정원을 2명으로 줄이려 하면 거부되어야 한다.

    res = client.patch(f"/api/studies/{study['id']}", json={"capacity": 2}, headers=owner_headers)
    assert res.status_code == 400


def test_campus_derived_from_creator_and_filterable(client):
    pangyo_headers = _signup_and_login(client, username="pangyoer", skala_id="SKALA-PG", campus="PANGYO")
    ulsan_headers = _signup_and_login(client, username="ulsaner", skala_id="SKALA-US", campus="ULSAN")

    pangyo_study = client.post(
        "/api/studies", json=_study_payload(name="판교스터디"), headers=pangyo_headers
    ).json()
    assert pangyo_study["campus"] == "PANGYO"
    assert pangyo_study["campus_label"] == "판교"

    client.post("/api/studies", json=_study_payload(name="울산스터디"), headers=ulsan_headers)

    res = client.get("/api/studies", params={"campus": "ULSAN"}, headers=pangyo_headers)
    names = {item["name"] for item in res.json()["items"]}
    assert names == {"울산스터디"}


def test_only_creator_can_view_member_list(client):
    owner_headers = _signup_and_login(client, username="leader1", skala_id="SKALA-LEAD1")
    member_headers = _signup_and_login(client, username="joiner1", skala_id="SKALA-JOIN1", campus="GWANGJU")
    outsider_headers = _signup_and_login(client, username="outsider1", skala_id="SKALA-OUT1")

    study = client.post(
        "/api/studies", json=_study_payload(capacity=5), headers=owner_headers
    ).json()
    study_id = study["id"]
    client.post(f"/api/studies/{study_id}/join", headers=member_headers)

    forbidden_res = client.get(f"/api/studies/{study_id}/members", headers=outsider_headers)
    assert forbidden_res.status_code == 403

    ok_res = client.get(f"/api/studies/{study_id}/members", headers=owner_headers)
    assert ok_res.status_code == 200
    usernames = [m["username"] for m in ok_res.json()]
    assert usernames == ["leader1", "joiner1"]
    assert ok_res.json()[1]["campus_label"] == "광주"


def test_exam_date_optional(client):
    headers = _signup_and_login(client)

    with_exam = client.post(
        "/api/studies", json=_study_payload(name="SQLD 9월 목표", exam_date="2026-09-06"), headers=headers
    ).json()
    assert with_exam["exam_date"] == "2026-09-06"

    without_exam = client.post(
        "/api/studies", json=_study_payload(name="수업스터디", category="CLASS_STUDY"), headers=headers
    ).json()
    assert without_exam["exam_date"] is None
