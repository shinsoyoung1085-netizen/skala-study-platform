"""
Google Identity Services에서 발급한 ID 토큰을 검증하는 모듈.
서버가 client_secret 없이 구글의 공개키로 토큰 서명/발급자/대상(audience)만 검증하는
가장 단순하고 안전한 방식이다 (OAuth 인가 코드 교환 방식이 아님).
"""
from dataclasses import dataclass

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.core.config import settings


@dataclass
class GoogleProfile:
    google_id: str
    email: str
    name: str
    picture: str | None


class InvalidGoogleTokenError(Exception):
    pass


def verify_google_id_token(token: str) -> GoogleProfile:
    """
    구글이 발급한 ID 토큰을 검증하고 프로필 정보를 추출한다.
    서명, 만료시간, audience(우리 GOOGLE_CLIENT_ID)를 모두 구글 라이브러리가 검증해준다.
    """
    try:
        payload = google_id_token.verify_oauth2_token(
            token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError as exc:
        raise InvalidGoogleTokenError(str(exc)) from exc

    if not payload.get("email_verified", False):
        raise InvalidGoogleTokenError("이메일이 인증되지 않은 구글 계정입니다.")

    return GoogleProfile(
        google_id=payload["sub"],
        email=payload["email"],
        name=payload.get("name") or payload["email"].split("@")[0],
        picture=payload.get("picture"),
    )
