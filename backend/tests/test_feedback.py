"""익명 후기/건의 게시판 - 작성/수정/삭제 및 관리자 답변/해결 상태 변경 테스트."""
import app.routers.admin as admin_router
from app.models.user import User
from app.services.feedback_reviewer import FeedbackAiDraft, FeedbackReviewerNotConfiguredError


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


def _create_feedback(client, headers, content="건의 내용입니다"):
    res = client.post("/api/feedback", json={"category": "SUGGESTION", "content": content}, headers=headers)
    assert res.status_code == 201
    return res.json()


def test_create_and_list_feedback_defaults_unresolved_without_reply(client):
    headers = _signup_and_login(client)
    created = _create_feedback(client, headers)
    assert created["is_resolved"] is False
    assert created["admin_reply"] is None
    assert created["replied_at"] is None

    res = client.get("/api/feedback", headers=headers)
    assert res.status_code == 200
    assert res.json()["total"] == 1


def test_author_can_edit_own_feedback(client):
    headers = _signup_and_login(client)
    created = _create_feedback(client, headers, content="원래 내용")

    res = client.patch(
        f"/api/feedback/{created['id']}", json={"content": "수정된 내용"}, headers=headers
    )
    assert res.status_code == 200
    assert res.json()["content"] == "수정된 내용"


def test_non_author_cannot_edit_feedback(client):
    author_headers = _signup_and_login(client, username="author1", skala_id="SKALA-A1")
    created = _create_feedback(client, author_headers)

    other_headers = _signup_and_login(client, username="other1", skala_id="SKALA-O1")
    res = client.patch(
        f"/api/feedback/{created['id']}", json={"content": "몰래 수정"}, headers=other_headers
    )
    assert res.status_code == 403


def test_non_admin_cannot_reply_or_resolve(client):
    headers = _signup_and_login(client)
    created = _create_feedback(client, headers)

    res = client.patch(
        f"/api/admin/feedback/{created['id']}", json={"admin_reply": "답변입니다"}, headers=headers
    )
    assert res.status_code == 403


def test_admin_can_reply_and_toggle_resolved(client, db_session):
    admin_headers = _signup_and_login(client, username="admin1", skala_id="SKALA-ADMIN")
    _promote_to_admin(db_session, "admin1")

    member_headers = _signup_and_login(client, username="member1", skala_id="SKALA-M1")
    created = _create_feedback(client, member_headers)

    reply_res = client.patch(
        f"/api/admin/feedback/{created['id']}",
        json={"admin_reply": "확인했습니다. 반영하겠습니다."},
        headers=admin_headers,
    )
    assert reply_res.status_code == 200
    body = reply_res.json()
    assert body["admin_reply"] == "확인했습니다. 반영하겠습니다."
    assert body["replied_at"] is not None
    assert body["is_resolved"] is False

    resolve_res = client.patch(
        f"/api/admin/feedback/{created['id']}", json={"is_resolved": True}, headers=admin_headers
    )
    assert resolve_res.status_code == 200
    resolved_body = resolve_res.json()
    assert resolved_body["is_resolved"] is True
    # 해결 처리만 했을 때 기존 답변 내용은 그대로 유지되어야 한다.
    assert resolved_body["admin_reply"] == "확인했습니다. 반영하겠습니다."

    # 작성자 본인이 조회해도 관리자 답변과 해결 상태가 보여야 한다.
    list_res = client.get("/api/feedback", headers=member_headers)
    item = list_res.json()["items"][0]
    assert item["is_resolved"] is True
    assert item["admin_reply"] == "확인했습니다. 반영하겠습니다."


def test_ai_draft_requires_admin(client):
    headers = _signup_and_login(client)
    created = _create_feedback(client, headers)

    res = client.post(f"/api/admin/feedback/{created['id']}/ai-draft", headers=headers)
    assert res.status_code == 403


def test_ai_draft_returns_503_when_not_configured(client, db_session, monkeypatch):
    admin_headers = _signup_and_login(client, username="admin2", skala_id="SKALA-ADMIN2")
    _promote_to_admin(db_session, "admin2")
    created = _create_feedback(client, admin_headers)

    def fake_generate(feedback, category_label):
        raise FeedbackReviewerNotConfiguredError

    monkeypatch.setattr(admin_router, "generate_feedback_draft", fake_generate)

    res = client.post(f"/api/admin/feedback/{created['id']}/ai-draft", headers=admin_headers)
    assert res.status_code == 503


def test_ai_draft_returns_generated_draft_without_saving_it(client, db_session, monkeypatch):
    admin_headers = _signup_and_login(client, username="admin3", skala_id="SKALA-ADMIN3")
    _promote_to_admin(db_session, "admin3")
    created = _create_feedback(client, admin_headers, content="채팅방에 파일 첨부 기능이 있으면 좋겠어요")

    def fake_generate(feedback, category_label):
        assert category_label == "건의"
        return FeedbackAiDraft(
            feasibility_note="채팅 메시지 테이블에 첨부파일 컬럼을 추가하면 구현 가능합니다.",
            draft_reply="좋은 의견 감사합니다! 다음 업데이트에 반영을 검토하겠습니다.",
            suggested_resolved=False,
        )

    monkeypatch.setattr(admin_router, "generate_feedback_draft", fake_generate)

    res = client.post(f"/api/admin/feedback/{created['id']}/ai-draft", headers=admin_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["draft_reply"] == "좋은 의견 감사합니다! 다음 업데이트에 반영을 검토하겠습니다."
    assert body["suggested_resolved"] is False

    # AI 초안은 관리자가 실제로 저장하기 전까지 게시글에 반영되지 않아야 한다.
    list_res = client.get("/api/feedback", headers=admin_headers)
    item = list_res.json()["items"][0]
    assert item["admin_reply"] is None
    assert item["is_resolved"] is False
