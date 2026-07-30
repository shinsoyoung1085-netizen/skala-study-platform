import { apiClient } from "@/api/client";
import type {
  AdminApplicationAdminItem,
  AdminClassItem,
  AdminPasswordResetResponse,
  AdminRecommendationLogItem,
  AdminUser,
  AnalyticsOverviewResponse,
  ClassCreatePayload,
  Curriculum,
  CurriculumCreatePayload,
  Feedback,
  FeedbackAdminUpdatePayload,
  FeedbackAiDraft,
  StudyListResponse,
  Topic,
  TopicCreatePayload,
  UpdateCreatePayload,
  UpdateEditPayload,
  UpdateNotice,
} from "@/types";

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverviewResponse> {
  const { data } = await apiClient.get<AnalyticsOverviewResponse>("/api/admin/analytics/overview");
  return data;
}

export async function fetchAllUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<AdminUser[]>("/api/admin/users");
  return data;
}

export async function fetchAllStudiesForAdmin(): Promise<StudyListResponse> {
  const { data } = await apiClient.get<StudyListResponse>("/api/admin/studies");
  return data;
}

export async function resetUserPasswordByAdmin(userId: number): Promise<AdminPasswordResetResponse> {
  const { data } = await apiClient.post<AdminPasswordResetResponse>(
    `/api/admin/users/${userId}/reset-password`,
  );
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

/** 후기/건의에 관리자 답변을 남기거나(admin_reply), 해결 상태(is_resolved)를 변경한다. */
export async function updateFeedbackByAdmin(
  feedbackId: number,
  payload: FeedbackAdminUpdatePayload,
): Promise<Feedback> {
  const { data } = await apiClient.patch<Feedback>(`/api/admin/feedback/${feedbackId}`, payload);
  return data;
}

/** AI에게 현실성 검토 + 답변 초안을 요청한다. 결과는 저장되지 않으며 관리자가 검토 후 직접 저장해야 한다. */
export async function generateFeedbackAiDraft(feedbackId: number): Promise<FeedbackAiDraft> {
  const { data } = await apiClient.post<FeedbackAiDraft>(`/api/admin/feedback/${feedbackId}/ai-draft`);
  return data;
}
