import { apiClient } from "@/api/client";
import type { HomeVisitStats, MemberStats } from "@/types";

export async function fetchMemberStats(): Promise<MemberStats> {
  const { data } = await apiClient.get<MemberStats>("/api/stats/members");
  return data;
}

/** 홈 화면 방문수를 1 증가시키고, 증가된 누적 방문수를 반환한다. */
export async function pingHomeVisit(): Promise<HomeVisitStats> {
  const { data } = await apiClient.post<HomeVisitStats>("/api/stats/visits/ping");
  return data;
}
