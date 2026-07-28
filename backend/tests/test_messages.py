"""스터디 채팅 메시지 API 테스트."""


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


def test_non_member_cannot_read_or_send_messages(client):
    owner_headers = _signup_and_login(client, username="owner1", skala_id="SKALA-O1")
    outsider_headers = _signup_and_login(client, username="outsider1", skala_id="SKALA-OUT1")
    study = _create_study(client, owner_headers)

    get_res = client.get(f"/api/studies/{study['id']}/messages", headers=outsider_headers)
    assert get_res.status_code == 403

    post_res = client.post(
        f"/api/studies/{study['id']}/messages", json={"content": "안녕하세요"}, headers=outsider_headers
    )
    assert post_res.status_code == 403


def test_members_can_chat_and_see_each_others_messages(client):
    owner_headers = _signup_and_login(client, username="owner2", skala_id="SKALA-O2")
    member_headers = _signup_and_login(client, username="member2", skala_id="SKALA-M2")
    study = _create_study(client, owner_headers)
    client.post(f"/api/studies/{study['id']}/join", headers=member_headers)

    send1 = client.post(
        f"/api/studies/{study['id']}/messages", json={"content": "안녕하세요 반갑습니다"}, headers=owner_headers
    )
    assert send1.status_code == 201
    assert send1.json()["sender_name"] == "홍길동"
    assert send1.json()["is_mine"] is True

    send2 = client.post(
        f"/api/studies/{study['id']}/messages", json={"content": "네 반가워요!"}, headers=member_headers
    )
    assert send2.status_code == 201

    list_as_owner = client.get(f"/api/studies/{study['id']}/messages", headers=owner_headers)
    assert list_as_owner.status_code == 200
    messages = list_as_owner.json()
    assert len(messages) == 2
    assert messages[0]["content"] == "안녕하세요 반갑습니다"
    assert messages[0]["is_mine"] is True
    assert messages[1]["content"] == "네 반가워요!"
    assert messages[1]["is_mine"] is False

    list_as_member = client.get(f"/api/studies/{study['id']}/messages", headers=member_headers)
    assert list_as_member.json()[1]["is_mine"] is True


def test_empty_message_rejected(client):
    owner_headers = _signup_and_login(client, username="owner3", skala_id="SKALA-O3")
    study = _create_study(client, owner_headers)

    res = client.post(f"/api/studies/{study['id']}/messages", json={"content": ""}, headers=owner_headers)
    assert res.status_code == 422
