import { apiClient } from "@/api/client";
import type { ClassOption, DashboardResponse, HeartbeatResponse } from "@/types";

export async function fetchDashboard(): Promise<DashboardResponse> {
  const { data } = await apiClient.get<DashboardResponse>("/api/leaderboard/dashboard");
  return data;
}

/** 내 캠퍼스 안에 있는 반 목록 (마이페이지 반 선택 드롭다운용). */
export async function fetchMyCampusClasses(): Promise<ClassOption[]> {
  const { data } = await apiClient.get<ClassOption[]>("/api/leaderboard/classes");
  return data;
}

export async function sendHeartbeat(elapsedSeconds: number): Promise<HeartbeatResponse> {
  const { data } = await apiClient.post<HeartbeatResponse>("/api/leaderboard/heartbeat", {
    elapsed_seconds: elapsedSeconds,
  });
  return data;
}
