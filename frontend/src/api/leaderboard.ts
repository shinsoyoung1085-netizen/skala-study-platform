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

/** 오늘(한국시간 기준) 누적 공부시간 조회. 페이지 새로고침 시 스톱워치 초기값을 세팅하는 데 쓴다. */
export async function fetchTodaySeconds(): Promise<HeartbeatResponse> {
  const { data } = await apiClient.get<HeartbeatResponse>("/api/leaderboard/today");
  return data;
}
