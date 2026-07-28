import { CampusDonutChart } from "@/components/admin/CampusDonutChart";
import { MemberTypeBarChart } from "@/components/admin/MemberTypeBarChart";
import { StatCard } from "@/components/admin/StatCard";
import type { AdminUser, Study } from "@/types";
import { computeMemberStats } from "@/utils/adminStats";

interface AnalyticsDashboardProps {
  users: AdminUser[];
  studies: Study[];
}

/** 관리자 페이지 상단의 ERP 스타일 요약 대시보드. 회원/스터디 데이터를 그대로 집계해서 보여준다. */
export function AnalyticsDashboard({ users, studies }: AnalyticsDashboardProps) {
  const stats = computeMemberStats(users);

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="전체 회원 수" value={stats.totalMembers} />
        <StatCard
          label="관리자"
          value={stats.adminCount}
          hint={`전체의 ${stats.adminPercentage}%`}
        />
        <StatCard label="일반회원" value={stats.regularCount} />
        <StatCard label="전체 스터디 수" value={studies.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 text-sm font-bold text-gray-900">캠퍼스별 회원 분포</h3>
          <CampusDonutChart data={stats.campusBreakdown} />
        </div>
        <div className="card">
          <h3 className="mb-2 text-sm font-bold text-gray-900">회원 유형 분포</h3>
          <MemberTypeBarChart adminCount={stats.adminCount} regularCount={stats.regularCount} />
        </div>
      </div>
    </div>
  );
}
