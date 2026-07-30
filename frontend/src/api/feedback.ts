import { apiClient } from "@/api/client";
import type { Feedback, FeedbackCreatePayload, FeedbackListResponse } from "@/types";

export async function fetchFeedback(): Promise<FeedbackListResponse> {
  const { data } = await apiClient.get<FeedbackListResponse>("/api/feedback");
  return data;
}

export async function createFeedback(payload: FeedbackCreatePayload): Promise<Feedback> {
  const { data } = await apiClient.post<Feedback>("/api/feedback", payload);
  return data;
}

export async function deleteFeedback(feedbackId: number): Promise<void> {
  await apiClient.delete(`/api/feedback/${feedbackId}`);
}
