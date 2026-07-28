import { apiClient } from "@/api/client";
import type { AdminRecommendationLogItem, AdminUser, StudyListResponse } from "@/types";

export async function fetchAllUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<AdminUser[]>("/api/admin/users");
  return data;
}

export async function fetchAllStudiesForAdmin(): Promise<StudyListResponse> {
  const { data } = await apiClient.get<StudyListResponse>("/api/admin/studies");
  return data;
}

export async function deleteUserByAdmin(userId: number): Promise<void> {
  await apiClient.delete(`/api/admin/users/${userId}`);
}

export async function deleteStudyByAdmin(studyId: number): Promise<void> {
  await apiClient.delete(`/api/admin/studies/${studyId}`);
}

export async function fetchLeaderRecommendations(): Promise<AdminRecommendationLogItem[]> {
  const { data } = await apiClient.get<AdminRecommendationLogItem[]>("/api/admin/leader-recommendations");
  return data;
}
