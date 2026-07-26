import { apiClient } from "@/api/client";
import type { Study, StudyCreatePayload, StudyFilters, StudyListResponse } from "@/types";

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

export async function joinStudy(studyId: number): Promise<Study> {
  const { data } = await apiClient.post<Study>(`/api/studies/${studyId}/join`);
  return data;
}

export async function leaveStudy(studyId: number): Promise<void> {
  await apiClient.delete(`/api/studies/${studyId}/leave`);
}
