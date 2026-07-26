// 백엔드 스키마(app/schemas)와 1:1로 대응되는 타입 정의.
// 백엔드 응답 구조가 바뀌면 이 파일도 함께 업데이트해야 한다.

export interface OptionItem {
  code: string;
  label: string;
}

export interface UserSummary {
  id: number;
  name: string;
  username: string;
}

export interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  skala_id: string;
  is_admin: boolean;
  interests: string[];
  joined_study_count: number;
  created_at: string;
}

export interface AdminUser {
  id: number;
  name: string;
  username: string;
  email: string;
  skala_id: string;
  is_admin: boolean;
  created_at: string;
}

export interface Study {
  id: number;
  name: string;
  category: string;
  category_label: string;
  capacity: number;
  description: string;
  days: string[];
  day_label: string;
  time: string;
  location: string;
  location_label: string;
  is_online: boolean;
  exam_date: string | null;
  current_member_count: number;
  is_full: boolean;
  creator: UserSummary;
  is_joined: boolean;
  created_at: string;
}

export interface StudyListResponse {
  total: number;
  items: Study[];
}

export interface SignupPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  skala_id: string;
  interests: string[];
}

export interface LoginPayload {
  username: string;
  password: string;
  remember_me: boolean;
}

export interface StudyCreatePayload {
  name: string;
  category: string;
  capacity: number;
  description: string;
  days: string[];
  time: string;
  location: string;
  is_online: boolean;
  exam_date?: string | null;
}

export interface StudyFilters {
  keyword?: string;
  category?: string;
  day_of_week?: string;
  location?: string;
  is_online?: boolean;
}
