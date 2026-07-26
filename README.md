# SKALA STUDY

> 너, 내 동료가 돼라.

SKALA 교육생 전용 스터디 매칭 플랫폼입니다. 혼자 공부하지 말고 함께 성장할 동료를 찾아보세요.

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS + React Router |
| Backend | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 + Alembic |
| 인증 | JWT (python-jose) + bcrypt (passlib) |

## 폴더 구조

```
skala-study/
├── backend/          # FastAPI 서버
│   ├── app/
│   │   ├── core/         # 설정, 보안(JWT/암호화)
│   │   ├── db/           # DB 세션/엔진
│   │   ├── models/       # SQLAlchemy 모델 + Enum 정의
│   │   ├── schemas/      # Pydantic 요청/응답 스키마
│   │   ├── routers/      # API 라우터 (auth/users/studies/admin/options)
│   │   ├── utils/        # 공용 변환 함수
│   │   └── main.py       # FastAPI 진입점
│   ├── alembic/          # DB 마이그레이션
│   ├── scripts/          # 관리자 계정 생성 스크립트
│   ├── tests/            # pytest 테스트
│   └── requirements.txt
├── frontend/         # React 앱
│   └── src/
│       ├── api/          # axios 기반 API 클라이언트
│       ├── components/   # common/layout/study 컴포넌트
│       ├── contexts/     # 인증 Context
│       ├── pages/        # 화면 단위 페이지
│       └── types/        # 프론트-백엔드 공유 타입
└── docs/
    └── ERD.md        # 데이터베이스 설계 문서
```

## 사전 준비물

- Python 3.10 이상
- Node.js 18 이상
- PostgreSQL 14 이상 (로컬 설치 또는 Docker)

이 코드는 대화형 세션(샌드박스) 환경에서 작성되었으며, 해당 환경에는 Python/Node 런타임이 설치되어 있지 않아 실제 실행/테스트는 진행하지 못했습니다. 아래 절차대로 로컬 환경에서 실행하며 확인해주세요.

## 1. 데이터베이스 준비

PostgreSQL에 데이터베이스와 사용자를 생성합니다.

```sql
CREATE DATABASE skala_study;
CREATE USER skala_user WITH PASSWORD 'skala_password';
GRANT ALL PRIVILEGES ON DATABASE skala_study TO skala_user;
```

## 2. 백엔드 실행

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

copy .env.example .env
# .env 파일을 열어 DATABASE_URL, JWT_SECRET_KEY 등을 실제 값으로 수정하세요.

# DB 테이블 생성 (Alembic 마이그레이션 적용)
alembic upgrade head

# (선택) 관리자 계정 생성 - admin / admin1234!
python scripts/create_admin.py

# 개발 서버 실행
uvicorn app.main:app --reload
```

- API 서버: http://localhost:8000
- Swagger UI (API 문서 자동 생성): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 백엔드 테스트 실행

```powershell
cd backend
pytest
```

테스트는 PostgreSQL 없이도 SQLite 인메모리 DB로 동작하도록 구성되어 있어 별도 DB 설정 없이 바로 실행할 수 있습니다.

## 3. 프론트엔드 실행

```powershell
cd frontend
npm install

copy .env.example .env
# VITE_API_BASE_URL이 백엔드 주소(기본 http://localhost:8000)와 일치하는지 확인하세요.

npm run dev
```

- 개발 서버: http://localhost:5173

## 4. 사용 흐름

1. `/` 첫 화면에서 회원가입 → 관심분야 선택(복수 가능) 후 가입
2. 로그인 (로그인 유지 체크 시 브라우저 재실행 후에도 로그인 상태 유지)
3. 홈 → 스터디 메뉴에서 스터디 생성/검색/필터/참여
4. 내 스터디에서 참여중인 스터디 확인 및 탈퇴
5. 마이페이지에서 내 정보(이름/관심분야/참여 스터디 수) 확인
6. 관리자 계정으로 로그인 시 상단 메뉴에 "관리자" 탭이 노출되며 회원/스터디 목록 조회 및 삭제 가능

## 5. 배포 (Render + Vercel)

이 저장소에는 배포 설정 파일이 이미 포함되어 있습니다: 루트의 `render.yaml`(백엔드+DB), `frontend/vercel.json`(프론트엔드).

### 5.1 백엔드 + DB — Render

1. GitHub에 이 저장소를 푸시해둔 상태에서, [Render 대시보드](https://dashboard.render.com) → **New > Blueprint** → 이 저장소 선택
2. `render.yaml`을 인식해 `skala-study-backend`(웹 서비스)와 `skala-study-db`(PostgreSQL)가 자동 생성됩니다
   - `JWT_SECRET_KEY`는 Render가 안전한 값으로 자동 생성
   - `DATABASE_URL`은 생성된 DB 인스턴스와 자동 연결
3. 배포가 끝나면 백엔드 주소(예: `https://skala-study-backend.onrender.com`)가 발급됩니다 — 이 주소를 기억해두세요 (5.2에서 사용)
4. `CORS_ORIGINS` 환경변수는 5.2에서 Vercel 주소를 받은 뒤 다시 돌아와 업데이트해야 합니다 (초기값은 플레이스홀더)

### 5.2 프론트엔드 — Vercel

1. [Vercel 대시보드](https://vercel.com/new) → 이 저장소 Import
2. **Root Directory**를 `frontend`로 지정 (Vite 프레임워크 자동 인식됨)
3. 환경변수 `VITE_API_BASE_URL`을 5.1에서 발급된 Render 백엔드 주소로 설정
4. 배포 완료 후 발급된 Vercel 주소(예: `https://skala-study.vercel.app`)를 확인

### 5.3 마무리

- Render 백엔드의 `CORS_ORIGINS` 환경변수를 실제 Vercel 주소로 업데이트 후 재배포
- `backend/scripts/create_admin.py`의 기본 관리자 비밀번호(`admin1234!`)를 배포 전 반드시 변경
- `backend/.env`, `frontend/.env`는 저장소에 커밋하지 않으며, 각 플랫폼의 환경변수 설정 화면에서 별도로 관리합니다

## 6. 데이터베이스 설계

자세한 ERD와 필드 정의는 [docs/ERD.md](docs/ERD.md)를 참고하세요.
