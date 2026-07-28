import { useEffect, useState } from "react";

import { fetchMemberStats } from "@/api/stats";
import type { MemberStats } from "@/types";

/** 홈 화면에 전체 가입자 수와 캠퍼스별 인원을 굵은 글씨로 보여주는 통계 바. */
export function MemberStatsBar() {
  const [stats, setStats] = useState<MemberStats | null>(null);

  useEffect(() => {
    fetchMemberStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  if (!stats) return null;

  return (
    <div className="card mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
      <p>
        전체 가입자 <span className="font-extrabold text-gray-900">{stats.total_members}명</span>
      </p>
      {stats.campus_counts.map((c) => (
        <p key={c.code}>
          {c.label} <span className="font-extrabold text-gray-900">{c.count}명</span>
        </p>
      ))}
    </div>
  );
}
