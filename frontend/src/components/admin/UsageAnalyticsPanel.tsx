import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { fetchAnalyticsOverview } from "@/api/admin";
import { extractErrorMessage } from "@/api/client";
import { StatCard } from "@/components/admin/StatCard";
import { Alert } from "@/components/common/Alert";
import { Spinner } from "@/components/common/Spinner";
import type { AnalyticsOverviewResponse } from "@/types";

/** 관리자 "이용 분석" 탭: 캠퍼스별/기능별 방문 현황과 회원별 방문 순위를 보여준다. */
export function UsageAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsOverview()
      .then(setData)
      .catch((err) => setError(extractErrorMessage(err, "이용 분석 데이터를 불러오지 못했습니다.")));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner label="불러오는 중..." />;

  return (
    <div className="flex flex-col gap-4">
      <StatCard label="전체 방문 기록 수" value={data.total_visits} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 text-sm font-bold text-gray-900">캠퍼스별 이용률</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.by_campus} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${Number(value)}회`, "방문"]} />
              <Bar dataKey="visit_count" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={64} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-2 text-sm font-bold text-gray-900">기능별 이용률 (많이 본 화면 순)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.by_feature} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${Number(value)}회`, "방문"]} />
              <Bar dataKey="visit_count" fill="#eb6834" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="mb-3 text-sm font-bold text-gray-900">회원별 방문 순위 (상위 50명)</h3>
        {data.top_users.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">아직 방문 기록이 없습니다.</p>
        ) : (
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-2 pr-4">이름</th>
                <th className="py-2 pr-4">캠퍼스</th>
                <th className="py-2 pr-4">방문 횟수</th>
                <th className="py-2 pr-4">마지막 방문</th>
              </tr>
            </thead>
            <tbody>
              {data.top_users.map((u) => (
                <tr key={u.user_id} className="border-b border-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-800">{u.name}</td>
                  <td className="py-3 pr-4">{u.campus_label}</td>
                  <td className="py-3 pr-4">{u.visit_count}회</td>
                  <td className="py-3 pr-4 text-gray-500">
                    {u.last_visited_at ? new Date(u.last_visited_at).toLocaleString("ko-KR") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
