import { apiClient } from "@/api/client";
import type { Feedback, FeedbackCreatePayload, FeedbackEditPayload, FeedbackListResponse } from "@/types";

export async function fetchFeedback(): Promise<FeedbackListResponse> {
  const { data } = await apiClient.get<FeedbackListResponse>("/api/feedback");
  return data;
}

export async function createFeedback(payload: FeedbackCreatePayload): Promise<Feedback> {
  const { data } = await apiClient.post<Feedback>("/api/feedback", payload);
  return data;
}

/** 본인이 작성한 후기/건의 내용을 수정한다. */
export async function editFeedback(feedbackId: number, payload: FeedbackEditPayload): Promise<Feedback> {
  const { data } = await apiClient.patch<Feedback>(`/api/feedback/${feedbackId}`, payload);
  return data;
}

export async function deleteFeedback(feedbackId: number): Promise<void> {
  await apiClient.delete(`/api/feedback/${feedbackId}`);
}
