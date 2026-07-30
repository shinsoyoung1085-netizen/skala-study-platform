import { apiClient } from "@/api/client";
import type {
  AdminApplicationAdminItem,
  AdminClassItem,
  AdminRecommendationLogItem,
  AdminUser,
  ClassCreatePayload,
  Curriculum,
  CurriculumCreatePayload,
  StudyListResponse,
  Topic,
  TopicCreatePayload,
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

export async function fetchAdminApplications(): Promise<AdminApplicationAdminItem[]> {
  const { data } = await apiClient.get<AdminApplicationAdminItem[]>("/api/admin/admin-applications");
  return data;
}

export async function approveAdminApplication(applicationId: number): Promise<AdminApplicationAdminItem> {
  const { data } = await apiClient.post<AdminApplicationAdminItem>(
    `/api/admin/admin-applications/${applicationId}/approve`,
  );
  return data;
}

export async function rejectAdminApplication(applicationId: number): Promise<AdminApplicationAdminItem> {
  const { data } = await apiClient.post<AdminApplicationAdminItem>(
    `/api/admin/admin-applications/${applicationId}/reject`,
  );
  return data;
}

export async function createCurriculumByAdmin(payload: CurriculumCreatePayload): Promise<Curriculum> {
  const { data } = await apiClient.post<Curriculum>("/api/admin/curricula", payload);
  return data;
}

export async function deleteCurriculumByAdmin(curriculumId: number): Promise<void> {
  await apiClient.delete(`/api/admin/curricula/${curriculumId}`);
}

export async function createTopicByAdmin(curriculumId: number, payload: TopicCreatePayload): Promise<Topic> {
  const { data } = await apiClient.post<Topic>(`/api/admin/curricula/${curriculumId}/topics`, payload);
  return data;
}

export async function fetchAllClassesForAdmin(): Promise<AdminClassItem[]> {
  const { data } = await apiClient.get<AdminClassItem[]>("/api/admin/classes");
  return data;
}

export async function createClassByAdmin(payload: ClassCreatePayload): Promise<AdminClassItem> {
  const { data } = await apiClient.post<AdminClassItem>("/api/admin/classes", payload);
  return data;
}

export async function deleteClassByAdmin(classId: number): Promise<void> {
  await apiClient.delete(`/api/admin/classes/${classId}`);
}

export async function deleteTopicByAdmin(topicId: number): Promise<void> {
  await apiClient.delete(`/api/admin/topics/${topicId}`);
}
