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

export interface UserSkill {
  category: string;
  level: string;
  level_label: string;
}

export interface UserSkillItem {
  category: string;
  level: string;
}

export interface CurriculumSummary {
  id: number;
  title: string;
}

export interface ClassSummary {
  id: number;
  name: string;
}

export interface ClassOption {
  id: number;
  campus: string;
  name: string;
}

export interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  skala_id: string;
  campus: string;
  campus_label: string;
  is_admin: boolean;
  is_main_admin: boolean;
  interests: string[];
  joined_study_count: number;
  points: number;
  picture_url: string | null;
  has_password: boolean;
  skills: UserSkill[];
  curriculum: CurriculumSummary | null;
  study_class: ClassSummary | null;
  created_at: string;
}

export interface AdminUser {
  id: number;
  name: string;
  username: string;
  email: string;
  skala_id: string;
  campus: string;
  campus_label: string;
  is_admin: boolean;
  is_main_admin: boolean;
  points: number;
  created_at: string;
}

export interface AdminPasswordResetResponse {
  temporary_password: string;
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
  campus: string;
  campus_label: string;
  current_member_count: number;
  is_full: boolean;
  creator: UserSummary;
  is_joined: boolean;
  is_creator: boolean;
  created_at: string;
}

export interface StudyListResponse {
  total: number;
  items: Study[];
}

export interface StudyMember {
  id: number;
  name: string;
  username: string;
  campus: string;
  campus_label: string;
  joined_at: string;
}

export interface SignupPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  skala_id: string;
  campus: string;
  interests: string[];
}

export interface LoginPayload {
  username: string;
  password: string;
  remember_me: boolean;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  campus?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface DeleteAccountPayload {
  password: string;
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
  campus?: string;
}

export interface RecommendLeaderPayload {
  reason_tag: string;
}

export interface RecommendLeaderResponse {
  message: string;
  points_given: number;
  reason_label: string;
}

export interface ReceivedRecommendation {
  study_name: string;
  reason_tag: string;
  reason_label: string;
  points_given: number;
  created_at: string;
}

export interface MyPointsResponse {
  points: number;
  recommendations_received: ReceivedRecommendation[];
}

export interface AdminRecommendationLogItem {
  id: number;
  leader_name: string;
  leader_username: string;
  study_name: string;
  points_given: number;
  reason_tag: string;
  reason_label: string;
  created_at: string;
}

export interface UpdateNotice {
  id: number;
  title: string;
  content: string;
  version: string | null;
  category: string;
  category_label: string;
  is_active: boolean;
  created_at: string;
}

export interface UpdateCreatePayload {
  title: string;
  content: string;
  version?: string | null;
  category: string;
  is_active: boolean;
}

export interface UpdateEditPayload {
  title?: string;
  content?: string;
  version?: string | null;
  category?: string;
  is_active?: boolean;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
  is_mine: boolean;
}

export interface SendMessagePayload {
  content: string;
}

export interface CampusCount {
  code: string;
  label: string;
  count: number;
}

export interface MemberStats {
  total_members: number;
  campus_counts: CampusCount[];
}

export interface HomeVisitStats {
  total_visits: number;
}

export interface CampusVisitCount {
  campus: string;
  label: string;
  visit_count: number;
}

export interface FeatureVisitCount {
  feature: string;
  label: string;
  visit_count: number;
}

export interface UserVisitCount {
  user_id: number;
  name: string;
  campus_label: string;
  visit_count: number;
  last_visited_at: string | null;
}

export interface AnalyticsOverviewResponse {
  total_visits: number;
  by_campus: CampusVisitCount[];
  by_feature: FeatureVisitCount[];
  top_users: UserVisitCount[];
}

export interface Feedback {
  id: number;
  category: string;
  category_label: string;
  content: string;
  is_mine: boolean;
  created_at: string;
}

export interface FeedbackListResponse {
  total: number;
  items: Feedback[];
}

export interface FeedbackCreatePayload {
  category: string;
  content: string;
}

export interface DailyBreakdownItem {
  log_date: string;
  seconds: number;
}

export interface RankBadge {
  rank: number;
  total: number;
}

export interface CampusProgress {
  campus: string;
  label: string;
  avg_seconds: number;
}

export interface DashboardResponse {
  my_weekly_seconds: number;
  my_daily_breakdown: DailyBreakdownItem[];
  individual_rank_in_class: RankBadge | null;
  class_rank_in_campus: RankBadge | null;
  campus_rank_overall: RankBadge | null;
  campus_progress: CampusProgress[];
  qualifies_this_week: boolean;
}

export interface HeartbeatResponse {
  today_seconds: number;
}

export interface AdminApplicationCreatePayload {
  reason: string;
}

export interface AdminApplication {
  id: number;
  reason: string;
  status: string;
  status_label: string;
  created_at: string;
  reviewed_at: string | null;
}

export interface AdminApplicationAdminItem {
  id: number;
  applicant_name: string;
  applicant_username: string;
  reason: string;
  status: string;
  status_label: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
}

export interface GoogleLoginResponse {
  needs_profile_completion: boolean;
  access_token: string | null;
  pending_token: string | null;
  email: string | null;
  name: string | null;
  picture: string | null;
}

export interface GoogleCompleteSignupPayload {
  pending_token: string;
  skala_id: string;
  campus: string;
  interests: string[];
}

export interface Curriculum {
  id: number;
  title: string;
  description: string;
  topic_count: number;
  member_count: number;
  created_at: string;
}

export interface CurriculumListResponse {
  total: number;
  items: Curriculum[];
}

export interface CurriculumCreatePayload {
  title: string;
  description?: string;
}

export interface AdminClassItem {
  id: number;
  campus: string;
  campus_label: string;
  name: string;
  member_count: number;
}

export interface ClassCreatePayload {
  campus: string;
  name: string;
}

export interface Topic {
  id: number;
  curriculum_id: number;
  title: string;
  order: number;
  message_count: number;
}

export interface TopicListResponse {
  total: number;
  items: Topic[];
}

export interface TopicCreatePayload {
  title: string;
  order: number;
}

export interface TopicMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  is_question: boolean;
  category: string | null;
  reply_to_id: number | null;
  is_accepted: boolean;
  is_solved: boolean;
  created_at: string;
  is_mine: boolean;
}

export interface TopicMessageCreatePayload {
  content: string;
  is_question?: boolean;
  category?: string | null;
  reply_to_id?: number | null;
}

export interface Post {
  id: number;
  curriculum_id: number;
  author: UserSummary;
  content: string;
  tags: string[];
  created_at: string;
}

export interface PostListResponse {
  total: number;
  items: Post[];
}

export interface PostCreatePayload {
  content: string;
  tags: string[];
}
