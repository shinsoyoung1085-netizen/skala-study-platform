import { apiClient } from "@/api/client";
import type { LoginPayload, SignupPayload, UserProfile } from "@/types";

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

export async function checkUsername(username: string): Promise<boolean> {
  const { data } = await apiClient.get<{ available: boolean }>("/api/auth/check-username", {
    params: { username },
  });
  return data.available;
}

export async function checkEmail(email: string): Promise<boolean> {
  const { data } = await apiClient.get<{ available: boolean }>("/api/auth/check-email", {
    params: { email },
  });
  return data.available;
}

export async function checkSkalaId(skalaId: string): Promise<boolean> {
  const { data } = await apiClient.get<{ available: boolean }>("/api/auth/check-skala-id", {
    params: { skala_id: skalaId },
  });
  return data.available;
}
