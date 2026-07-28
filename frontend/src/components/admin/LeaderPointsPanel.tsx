import { useEffect, useState } from "react";

import { fetchLeaderRecommendations } from "@/api/admin";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import type { AdminRecommendationLogItem, AdminUser } from "@/types";

interface LeaderPointsPanelProps {
  users: AdminUser[];
}

/** 관리자 "리더 포인트" 탭: 포인트 상위 랭킹 + 추천 지급 내역(추천자 정보는 제외). */
export function LeaderPointsPanel({ users }: LeaderPointsPanelProps) {
  const [log, setLog] = useState<AdminRecommendationLogItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderRecommendations()
      .then(setLog)
      .catch((err) => setError(extractErrorMessage(err, "추천 내역을 불러오지 못했습니다.")));
  }, []);

  const ranking = [...users]
    .filter((u) => u.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <h3 className="mb-3 text-sm font-bold text-gray-900">모임장 포인트 랭킹 (상위 10명)</h3>
        {ranking.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">아직 추천을 받은 모임장이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {ranking.map((u, index) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-gray-400">{index + 1}</span>
                  <span className="font-medium text-gray-800">{u.name}</span>
                  <span className="text-gray-400">{u.username} · {u.campus_label}</span>
                </div>
                <Badge tone="primary">{u.points}P</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <h3 className="mb-3 text-sm font-bold text-gray-900">추천 지급 내역</h3>
        {error && <Alert>{error}</Alert>}
        {!error && !log && <Spinner label="추천 내역을 불러오는 중..." />}
        {log && log.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">아직 추천 내역이 없습니다.</p>
        )}
        {log && log.length > 0 && (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-2 pr-4">모임장</th>
                <th className="py-2 pr-4">스터디</th>
                <th className="py-2 pr-4">칭찬 태그</th>
                <th className="py-2 pr-4">포인트</th>
                <th className="py-2 pr-4">일시</th>
              </tr>
            </thead>
            <tbody>
              {log.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-50">
                  <td className="py-3 pr-4">
                    {entry.leader_name} <span className="text-gray-400">({entry.leader_username})</span>
                  </td>
                  <td className="py-3 pr-4">{entry.study_name}</td>
                  <td className="py-3 pr-4">{entry.reason_label}</td>
                  <td className="py-3 pr-4">+{entry.points_given}P</td>
                  <td className="py-3 pr-4 text-gray-400">
                    {new Date(entry.created_at).toLocaleString("ko-KR")}
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
