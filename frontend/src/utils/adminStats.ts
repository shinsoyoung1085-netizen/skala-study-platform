import { CAMPUS_OPTIONS } from "@/constants/campusOptions";
import type { AdminUser } from "@/types";

export interface CampusBreakdownItem {
  code: string;
  label: string;
  count: number;
  percentage: number;
}

export interface MemberStats {
  totalMembers: number;
  adminCount: number;
  regularCount: number;
  adminPercentage: number;
  campusBreakdown: CampusBreakdownItem[];
}

/** 관리자 회원 목록으로부터 캠퍼스/권한 통계를 계산한다. (실제 저장된 campus 값 기준) */
export function computeMemberStats(users: AdminUser[]): MemberStats {
  const totalMembers = users.length;
  const adminCount = users.filter((u) => u.is_admin).length;
  const regularCount = totalMembers - adminCount;

  const campusBreakdown = CAMPUS_OPTIONS.map((option) => {
    const count = users.filter((u) => u.campus === option.code).length;
    return {
      code: option.code,
      label: option.label,
      count,
      percentage: totalMembers === 0 ? 0 : Math.round((count / totalMembers) * 1000) / 10,
    };
  }).filter((item) => item.count > 0);

  return {
    totalMembers,
    adminCount,
    regularCount,
    adminPercentage: totalMembers === 0 ? 0 : Math.round((adminCount / totalMembers) * 1000) / 10,
    campusBreakdown,
  };
}
