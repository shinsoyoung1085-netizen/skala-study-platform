# Google 로그인(OAuth 2.0) 설정 가이드

SKALA STUDY의 "Google로 계속하기" 기능은 Google Identity Services(GIS)의
ID 토큰 검증 방식을 사용합니다. `client_secret`은 필요 없고, **OAuth 클라이언트 ID**
하나만 발급받으면 됩니다.

## 1. GCP에서 OAuth 클라이언트 ID 발급

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 선택(또는 새로 생성)합니다.
2. **API 및 서비스 → OAuth 동의 화면**에서 동의 화면을 구성합니다.
   - User Type: 외부(External)
   - 앱 이름, 지원 이메일 등 필수 정보 입력
   - 테스트 단계라면 "테스트 사용자"에 로그인할 SKALA 이메일 계정들을 추가
3. **API 및 서비스 → 사용자 인증 정보(Credentials) → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**를 선택합니다.
   - 애플리케이션 유형: **웹 애플리케이션**
   - 승인된 자바스크립트 원본(Authorized JavaScript origins)에 프론트엔드 도메인을 등록
     - 로컬 개발: `http://localhost:5173`
     - 배포(Vercel): `https://<your-vercel-domain>`
   - 승인된 리디렉션 URI는 GIS 팝업/원탭 방식에서는 별도로 필요하지 않습니다.
4. 생성 후 발급되는 **클라이언트 ID**(`xxxxx.apps.googleusercontent.com` 형식)를 복사합니다.
   client secret은 사용하지 않으므로 별도로 보관할 필요가 없습니다.

## 2. 환경변수 설정

같은 클라이언트 ID를 백엔드/프론트엔드 양쪽에 설정합니다.

**backend/.env**
```
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

**frontend/.env**
```
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

배포 환경(Render/Vercel)에서도 동일한 이름의 환경변수를 각 서비스의
환경변수 설정 화면에 추가해야 합니다.

## 3. 동작 방식 요약

1. 프론트엔드에서 GIS 버튼을 클릭하면 Google이 발급한 **ID 토큰**을 콜백으로 받습니다.
2. 프론트엔드는 이 ID 토큰을 `POST /api/auth/google`로 전달합니다.
3. 백엔드는 `google-auth` 라이브러리로 토큰 서명/발급자(iss)/대상(aud=`GOOGLE_CLIENT_ID`)을 검증합니다.
4. 이미 가입된 사용자(같은 `google_id` 또는 이메일이 일치하는 기존 계정)라면 바로 로그인 처리(JWT 발급).
5. 처음 보는 사용자라면 SKALA 고유번호/캠퍼스 등 필수 정보를 입력받기 위한
   단기 유효기간(15분)의 "가입 대기 토큰"을 내려주고, 프론트엔드는 추가 정보를 받아
   `POST /api/auth/google/complete-signup`으로 가입을 마무리합니다.

## 4. 보안 참고사항

- client secret을 사용하지 않으므로 프론트엔드에 노출되는 클라이언트 ID는 비밀값이 아닙니다(원래 공개되는 값).
- 서버는 매 요청마다 Google의 공개키로 토큰 서명을 검증하며, `aud` 클레임이
  우리 `GOOGLE_CLIENT_ID`와 일치하지 않거나 `email_verified`가 false이면 거부합니다.
- 가입 대기 토큰은 일반 로그인 세션 토큰과 구분되도록 `sub` 클레임을 포함하지 않으며,
  `purpose` 클레임으로만 검증되므로 세션 토큰으로 오용될 수 없습니다.
- Google 계정으로만 가입한 사용자는 비밀번호가 없는 상태(`hashed_password IS NULL`)로
  저장되며, 마이페이지에서 언제든 비밀번호를 설정해 아이디/비밀번호 로그인도 함께 사용할 수 있습니다.
