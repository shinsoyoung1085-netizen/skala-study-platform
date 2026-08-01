import { apiClient } from "@/api/client";
import type {
  AdminApplication,
  AdminApplicationCreatePayload,
  ChangePasswordPayload,
  DeleteAccountPayload,
  MyPointsResponse,
  UpdateProfilePayload,
  UserProfile,
  UserSkillItem,
} from "@/types";

export async function fetchMyProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/api/users/me");
  return data;
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>("/api/users/me", payload);
  return data;
}

export async function changeMyPassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.post("/api/users/me/change-password", payload);
}

export async function deleteMyAccount(payload: DeleteAccountPayload): Promise<void> {
  await apiClient.delete("/api/users/me", { data: payload });
}

export async function updateMySkills(skills: UserSkillItem[]): Promise<UserProfile> {
  const { data } = await apiClient.put<UserProfile>("/api/users/me/skills", { skills });
  return data;
}

export async function setMyCurriculum(curriculumId: number): Promise<UserProfile> {
  const { data } = await apiClient.post<UserProfile>("/api/users/me/curriculum", {
    curriculum_id: curriculumId,
  });
  return data;
}

export async function setMyClass(classId: number): Promise<UserProfile> {
  const { data } = await apiClient.post<UserProfile>("/api/users/me/class", { class_id: classId });
  return data;
}

export async function fetchMyPoints(): Promise<MyPointsResponse> {
  const { data } = await apiClient.get<MyPointsResponse>("/api/users/me/points");
  return data;
}

export async function applyForAdmin(payload: AdminApplicationCreatePayload): Promise<AdminApplication> {
  const { data } = await apiClient.post<AdminApplication>("/api/users/me/admin-application", payload);
  return data;
}

export async function fetchMyAdminApplication(): Promise<AdminApplication | null> {
  const { data } = await apiClient.get<AdminApplication | null>("/api/users/me/admin-application");
  return data;
}

/** 현재 로그인한 계정에 구글 계정을 연동한다. 이미 다른 계정에 연동된 구글 계정이면 409가 발생한다. */
export async function linkGoogleAccount(idToken: string): Promise<UserProfile> {
  const { data } = await apiClient.post<UserProfile>("/api/users/me/link-google", { id_token: idToken });
  return data;
}
