import { apiClient } from "@/api/client";
import type { OptionItem } from "@/types";

export async function fetchCategoryOptions(): Promise<OptionItem[]> {
  const { data } = await apiClient.get<OptionItem[]>("/api/options/categories");
  return data;
}

export async function fetchDayOptions(): Promise<OptionItem[]> {
  const { data } = await apiClient.get<OptionItem[]>("/api/options/days");
  return data;
}

export async function fetchLocationOptions(): Promise<OptionItem[]> {
  const { data } = await apiClient.get<OptionItem[]>("/api/options/locations");
  return data;
}
