import { useEffect, useState } from "react";

import { fetchDashboard, fetchTodaySeconds } from "@/api/leaderboard";
import type { DashboardResponse } from "@/types";

function formatHours(seconds: number) {
  return (seconds / 3600).toFixed(1);
}

/** 마이페이지에서 오늘/이번 주 공부시간과 순위 배지를 간단히 보여주는 카드. */
export function StudyTimeSummaryCard() {
  const [todaySeconds, setTodaySeconds] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    fetchTodaySeconds()
      .then((res) => setTodaySeconds(res.today_seconds))
      .catch(() => setTodaySeconds(0));
    fetchDashboard()
      .then(setDashboard)
      .catch(() => setDashboard(null));
  }, []);

  if (todaySeconds === null || !dashboard) return null;

  return (
    <div className="card flex flex-col gap-3">
      <h3 className="text-base font-bold text-gray-900">공부시간</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">오늘 공부시간</p>
          <p className="mt-1 text-2xl font-extrabold text-primary">{formatHours(todaySeconds)}h</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">이번 주 공부시간</p>
          <p className="mt-1 text-2xl font-extrabold text-primary">{formatHours(dashboard.my_weekly_seconds)}h</p>
        </div>
      </div>

      {(dashboard.individual_rank_in_class || dashboard.class_rank_in_campus || dashboard.campus_rank_overall) && (
        <div className="flex flex-wrap gap-2 text-sm">
          {dashboard.individual_rank_in_class && (
            <span className="rounded-full bg-primary-50 px-3 py-1 font-bold text-primary-700">
              우리반 {dashboard.individual_rank_in_class.rank}위 / {dashboard.individual_rank_in_class.total}명
            </span>
          )}
          {dashboard.class_rank_in_campus && (
            <span className="rounded-full bg-primary-50 px-3 py-1 font-bold text-primary-700">
              캠퍼스 내 우리반 {dashboard.class_rank_in_campus.rank}위
            </span>
          )}
          {dashboard.campus_rank_overall && (
            <span className="rounded-full bg-primary-50 px-3 py-1 font-bold text-primary-700">
              전체 캠퍼스 {dashboard.campus_rank_overall.rank}위
            </span>
          )}
        </div>
      )}
    </div>
  );
}
