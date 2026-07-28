"""관리자 권한 신청/승인/거절(메인 관리자 전용) API 테스트."""

from app.models.user import User


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


def _make_main_admin(client, db_session, username="mainadmin", skala_id="SKALA-MAIN"):
    headers = _signup_and_login(client, username=username, skala_id=skala_id)
    user = db_session.query(User).filter(User.username == username).first()
    user.is_admin = True
    user.is_main_admin = True
    db_session.commit()
    return headers


def _make_sub_admin(client, db_session, username="subadmin", skala_id="SKALA-SUB"):
    headers = _signup_and_login(client, username=username, skala_id=skala_id)
    user = db_session.query(User).filter(User.username == username).first()
    user.is_admin = True
    user.is_main_admin = False
    db_session.commit()
    return headers


def test_user_can_apply_and_check_status(client):
    headers = _signup_and_login(client, username="applicant1", skala_id="SKALA-AP1")

    res = client.post(
        "/api/users/me/admin-application", json={"reason": "스터디 운영을 돕고 싶어요"}, headers=headers
    )
    assert res.status_code == 201
    assert res.json()["status"] == "PENDING"
    assert res.json()["status_label"] == "심사중"

    status_res = client.get("/api/users/me/admin-application", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "PENDING"


def test_cannot_apply_twice_while_pending(client):
    headers = _signup_and_login(client, username="applicant2", skala_id="SKALA-AP2")
    client.post("/api/users/me/admin-application", json={"reason": "1차 신청"}, headers=headers)

    res = client.post("/api/users/me/admin-application", json={"reason": "2차 신청"}, headers=headers)
    assert res.status_code == 400


def test_admin_cannot_apply(client, db_session):
    headers = _make_sub_admin(client, db_session, username="alreadyadmin", skala_id="SKALA-AL1")
    res = client.post("/api/users/me/admin-application", json={"reason": "신청"}, headers=headers)
    assert res.status_code == 400


def test_sub_admin_cannot_approve_applications(client, db_session):
    sub_headers = _make_sub_admin(client, db_session)
    applicant_headers = _signup_and_login(client, username="applicant3", skala_id="SKALA-AP3")
    application = client.post(
        "/api/users/me/admin-application", json={"reason": "신청"}, headers=applicant_headers
    ).json()

    # 조회는 부관리자도 가능해야 한다.
    list_res = client.get("/api/admin/admin-applications", headers=sub_headers)
    assert list_res.status_code == 200

    approve_res = client.post(
        f"/api/admin/admin-applications/{application['id']}/approve", headers=sub_headers
    )
    assert approve_res.status_code == 403


def test_main_admin_can_approve_and_applicant_becomes_sub_admin(client, db_session):
    main_headers = _make_main_admin(client, db_session)
    applicant_headers = _signup_and_login(client, username="applicant4", skala_id="SKALA-AP4")
    application = client.post(
        "/api/users/me/admin-application", json={"reason": "신청합니다"}, headers=applicant_headers
    ).json()

    approve_res = client.post(
        f"/api/admin/admin-applications/{application['id']}/approve", headers=main_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"

    applicant = db_session.query(User).filter(User.username == "applicant4").first()
    assert applicant.is_admin is True
    assert applicant.is_main_admin is False  # 승인되어도 부관리자일 뿐, 메인 관리자는 아니다.

    # 이미 처리된 신청을 다시 승인하려 하면 거부되어야 한다.
    again = client.post(
        f"/api/admin/admin-applications/{application['id']}/approve", headers=main_headers
    )
    assert again.status_code == 400


def test_main_admin_can_reject(client, db_session):
    main_headers = _make_main_admin(client, db_session, username="mainadmin2", skala_id="SKALA-MAIN2")
    applicant_headers = _signup_and_login(client, username="applicant5", skala_id="SKALA-AP5")
    application = client.post(
        "/api/users/me/admin-application", json={"reason": "신청합니다"}, headers=applicant_headers
    ).json()

    reject_res = client.post(
        f"/api/admin/admin-applications/{application['id']}/reject", headers=main_headers
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"

    applicant = db_session.query(User).filter(User.username == "applicant5").first()
    assert applicant.is_admin is False

    # 거절 후에는 다시 신청할 수 있어야 한다.
    reapply = client.post(
        "/api/users/me/admin-application", json={"reason": "다시 신청"}, headers=applicant_headers
    )
    assert reapply.status_code == 201


def test_main_admin_cannot_be_deleted(client, db_session):
    main_headers = _make_main_admin(client, db_session, username="mainadmin3", skala_id="SKALA-MAIN3")
    main_user = db_session.query(User).filter(User.username == "mainadmin3").first()

    res = client.delete(f"/api/admin/users/{main_user.id}", headers=main_headers)
    assert res.status_code == 400
