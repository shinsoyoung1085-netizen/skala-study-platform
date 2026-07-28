"""
애플리케이션 설정을 관리하는 모듈.
환경변수(.env)로부터 값을 읽어와 Settings 객체로 제공한다.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # PostgreSQL 접속 URL
    DATABASE_URL: str = "postgresql://skala_user:skala_password@localhost:5432/skala_study"

    # JWT 설정
    JWT_SECRET_KEY: str = "change-this-secret-key-to-a-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ACCESS_TOKEN_REMEMBER_EXPIRE_MINUTES: int = 10080

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Google 로그인 (GCP OAuth 클라이언트의 "클라이언트 ID". 비밀값이 아니라 프론트에도 노출되는 값이다)
    GOOGLE_CLIENT_ID: str = ""
    # Google 신규 가입 시 발급하는 "프로필 입력 대기" 토큰의 만료 시간(분)
    GOOGLE_PENDING_SIGNUP_EXPIRE_MINUTES: int = 15

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
