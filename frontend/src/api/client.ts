import axios from "axios";

const AUTH_STORAGE_KEY = "skala_study_token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

/** localStorage(로그인 유지) 또는 sessionStorage(임시 로그인)에서 토큰을 조회한다. */
export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_STORAGE_KEY) ?? sessionStorage.getItem(AUTH_STORAGE_KEY);
}

/** remember가 true면 localStorage(브라우저를 닫아도 유지), false면 sessionStorage(탭 종료 시 삭제)에 저장한다. */
export function storeToken(token: string, remember: boolean): void {
  clearStoredToken();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(AUTH_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

// 모든 요청에 Authorization 헤더를 자동으로 부착한다.
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** 백엔드 에러 응답(detail 필드)에서 사용자에게 보여줄 메시지를 추출한다. */
export function extractErrorMessage(error: unknown, fallback = "요청 처리 중 오류가 발생했습니다."): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}
