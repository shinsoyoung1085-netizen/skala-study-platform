import { apiClient } from "@/api/client";
import type {
  AdminRecommendationLogItem,
  AdminUser,
  StudyListResponse,
  UpdateCreatePayload,
  UpdateEditPayload,
  UpdateNotice,
} from "@/types";

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

export async function fetchAllUpdatesForAdmin(): Promise<UpdateNotice[]> {
  const { data } = await apiClient.get<UpdateNotice[]>("/api/admin/updates");
  return data;
}

export async function createUpdate(payload: UpdateCreatePayload): Promise<UpdateNotice> {
  const { data } = await apiClient.post<UpdateNotice>("/api/admin/updates", payload);
  return data;
}

export async function editUpdate(updateId: number, payload: UpdateEditPayload): Promise<UpdateNotice> {
  const { data } = await apiClient.put<UpdateNotice>(`/api/admin/updates/${updateId}`, payload);
  return data;
}

export async function deleteUpdateByAdmin(updateId: number): Promise<void> {
  await apiClient.delete(`/api/admin/updates/${updateId}`);
}
