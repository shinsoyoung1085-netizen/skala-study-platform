import { apiClient } from "@/api/client";
import type {
  FindPasswordPayload,
  FindPasswordResponse,
  FindUsernamePayload,
  FindUsernameResponse,
  GoogleCompleteSignupPayload,
  GoogleLoginResponse,
  LoginPayload,
  SignupPayload,
  UserProfile,
} from "@/types";

export async function signup(payload: SignupPayload): Promise<UserProfile> {
  const { data } = await apiClient.post<UserProfile>("/api/auth/signup", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<string> {
  const { data } = await apiClient.post<{ access_token: string; token_type: string }>(
    "/api/auth/login",
    payload,
  );
  return data.access_token;
}

export async function logout(): Promise<void> {
  await apiClient.post("/api/auth/logout");
}

// 중복 확인은 blur마다 자동으로 나가는 요청이라, 응답이 안 오면 "확인 중..."이 화면에 무한정 남는다.
// 로그인처럼 (Render 콜드스타트 등으로) 오래 걸려도 끝까지 기다려야 하는 요청과 달리, 이건 실패해도
// 사용자가 다시 시도하면 그만이므로 별도로 짧은 타임아웃을 둔다.
const DUPLICATE_CHECK_TIMEOUT_MS = 8000;

export async function checkUsername(username: string): Promise<boolean> {
  const { data } = await apiClient.get<{ available: boolean }>("/api/auth/check-username", {
    params: { username },
    timeout: DUPLICATE_CHECK_TIMEOUT_MS,
  });
  return data.available;
}

export async function checkEmail(email: string): Promise<boolean> {
  const { data } = await apiClient.get<{ available: boolean }>("/api/auth/check-email", {
    params: { email },
    timeout: DUPLICATE_CHECK_TIMEOUT_MS,
  });
  return data.available;
}

export async function checkSkalaId(skalaId: string): Promise<boolean> {
  const { data } = await apiClient.get<{ available: boolean }>("/api/auth/check-skala-id", {
    params: { skala_id: skalaId },
    timeout: DUPLICATE_CHECK_TIMEOUT_MS,
  });
  return data.available;
}

export async function googleLogin(idToken: string): Promise<GoogleLoginResponse> {
  const { data } = await apiClient.post<GoogleLoginResponse>("/api/auth/google", { id_token: idToken });
  return data;
}

export async function completeGoogleSignup(payload: GoogleCompleteSignupPayload): Promise<string> {
  const { data } = await apiClient.post<{ access_token: string }>(
    "/api/auth/google/complete-signup",
    payload,
  );
  return data.access_token;
}

export async function findUsername(payload: FindUsernamePayload): Promise<FindUsernameResponse> {
  const { data } = await apiClient.post<FindUsernameResponse>("/api/auth/find-username", payload);
  return data;
}

export async function findPassword(payload: FindPasswordPayload): Promise<FindPasswordResponse> {
  const { data } = await apiClient.post<FindPasswordResponse>("/api/auth/find-password", payload);
  return data;
}
