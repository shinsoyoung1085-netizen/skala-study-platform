import { apiClient } from "@/api/client";
import type { UserProfile } from "@/types";

export async function fetchMyProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/api/users/me");
  return data;
}
