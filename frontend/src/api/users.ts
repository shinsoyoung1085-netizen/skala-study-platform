import { apiClient } from "@/api/client";
import type { ChangePasswordPayload, DeleteAccountPayload, UpdateProfilePayload, UserProfile } from "@/types";

export async function fetchMyProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/api/users/me");
  return data;
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>("/api/users/me", payload);
  return data;
}

export async function changeMyPassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.post("/api/users/me/change-password", payload);
}

export async function deleteMyAccount(payload: DeleteAccountPayload): Promise<void> {
  await apiClient.delete("/api/users/me", { data: payload });
}
