// 로그인 페이지의 "구글 계정 연동 안내" 말풍선을 닫으면(X) localStorage에 기록해 다시 보여주지 않는 유틸.
const STORAGE_KEY = "skala_study_dismissed_google_link_hint";

export function shouldShowGoogleLinkHint(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== "1";
}

export function dismissGoogleLinkHint(): void {
  localStorage.setItem(STORAGE_KEY, "1");
}
