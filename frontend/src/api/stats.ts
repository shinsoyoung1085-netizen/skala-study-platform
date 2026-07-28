import { apiClient } from "@/api/client";
import type { MemberStats } from "@/types";

export async function fetchMemberStats(): Promise<MemberStats> {
  const { data } = await apiClient.get<MemberStats>("/api/stats/members");
  return data;
}
