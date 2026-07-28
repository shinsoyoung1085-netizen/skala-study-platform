import { apiClient } from "@/api/client";
import type { UpdateNotice } from "@/types";

export async function fetchLatestUpdate(): Promise<UpdateNotice | null> {
  const { data } = await apiClient.get<UpdateNotice | null>("/api/updates/latest");
  return data;
}
