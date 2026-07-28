import { apiClient } from "@/api/client";
import type {
  ChatMessage,
  RecommendLeaderPayload,
  RecommendLeaderResponse,
  SendMessagePayload,
  Study,
  StudyCreatePayload,
  StudyFilters,
  StudyListResponse,
  StudyMember,
} from "@/types";

export async function fetchStudies(filters: StudyFilters): Promise<StudyListResponse> {
  const { data } = await apiClient.get<StudyListResponse>("/api/studies", {
    params: filters,
  });
  return data;
}

export async function fetchMyStudies(): Promise<StudyListResponse> {
  const { data } = await apiClient.get<StudyListResponse>("/api/studies/my");
  return data;
}

export async function fetchStudyDetail(studyId: number): Promise<Study> {
  const { data } = await apiClient.get<Study>(`/api/studies/${studyId}`);
  return data;
}

export async function createStudy(payload: StudyCreatePayload): Promise<Study> {
  const { data } = await apiClient.post<Study>("/api/studies", payload);
  return data;
}

export async function updateStudy(studyId: number, payload: StudyCreatePayload): Promise<Study> {
  const { data } = await apiClient.patch<Study>(`/api/studies/${studyId}`, payload);
  return data;
}

export async function joinStudy(studyId: number): Promise<Study> {
  const { data } = await apiClient.post<Study>(`/api/studies/${studyId}/join`);
  return data;
}

export async function leaveStudy(studyId: number): Promise<void> {
  await apiClient.delete(`/api/studies/${studyId}/leave`);
}

export async function deleteStudy(studyId: number): Promise<void> {
  await apiClient.delete(`/api/studies/${studyId}`);
}

export async function fetchStudyMembers(studyId: number): Promise<StudyMember[]> {
  const { data } = await apiClient.get<StudyMember[]>(`/api/studies/${studyId}/members`);
  return data;
}

export async function recommendLeader(
  studyId: number,
  payload: RecommendLeaderPayload,
): Promise<RecommendLeaderResponse> {
  const { data } = await apiClient.post<RecommendLeaderResponse>(
    `/api/studies/${studyId}/recommend-leader`,
    payload,
  );
  return data;
}

export async function fetchStudyMessages(studyId: number): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<ChatMessage[]>(`/api/studies/${studyId}/messages`);
  return data;
}

export async function sendStudyMessage(
  studyId: number,
  payload: SendMessagePayload,
): Promise<ChatMessage> {
  const { data } = await apiClient.post<ChatMessage>(`/api/studies/${studyId}/messages`, payload);
  return data;
}
