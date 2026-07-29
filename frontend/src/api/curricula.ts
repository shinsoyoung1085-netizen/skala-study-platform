import { apiClient } from "@/api/client";
import type {
  Curriculum,
  CurriculumListResponse,
  TopicListResponse,
  TopicMessage,
  TopicMessageCreatePayload,
  UserSummary,
} from "@/types";

export async function fetchCurricula(): Promise<CurriculumListResponse> {
  const { data } = await apiClient.get<CurriculumListResponse>("/api/curricula");
  return data;
}

export async function fetchCurriculumDetail(curriculumId: number): Promise<Curriculum> {
  const { data } = await apiClient.get<Curriculum>(`/api/curricula/${curriculumId}`);
  return data;
}

export async function fetchTopics(curriculumId: number): Promise<TopicListResponse> {
  const { data } = await apiClient.get<TopicListResponse>(`/api/curricula/${curriculumId}/topics`);
  return data;
}

export async function fetchTopicMessages(topicId: number): Promise<TopicMessage[]> {
  const { data } = await apiClient.get<TopicMessage[]>(`/api/curricula/topics/${topicId}/messages`);
  return data;
}

export async function sendTopicMessage(
  topicId: number,
  payload: TopicMessageCreatePayload,
): Promise<TopicMessage> {
  const { data } = await apiClient.post<TopicMessage>(
    `/api/curricula/topics/${topicId}/messages`,
    payload,
  );
  return data;
}

export async function acceptTopicMessage(topicId: number, messageId: number): Promise<TopicMessage> {
  const { data } = await apiClient.post<TopicMessage>(
    `/api/curricula/topics/${topicId}/messages/${messageId}/accept`,
  );
  return data;
}

export async function fetchExperts(topicId: number, category: string): Promise<UserSummary[]> {
  const { data } = await apiClient.get<UserSummary[]>(`/api/curricula/topics/${topicId}/experts`, {
    params: { category },
  });
  return data;
}
