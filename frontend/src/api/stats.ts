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

/** 회원별/기능별 이용 분석(관리자 대시보드)을 위한 방문 기록. 실패해도 화면에 영향 없어야 하므로 호출부에서 조용히 무시한다. */
export async function trackVisit(feature: string): Promise<void> {
  await apiClient.post("/api/stats/track", { feature });
}
