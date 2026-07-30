import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { fetchDashboard } from "@/api/leaderboard";
import { useStudyTimer } from "@/contexts/StudyTimerContext";
import type { DashboardResponse } from "@/types";

function formatHours(seconds: number) {
  return (seconds / 3600).toFixed(1);
}

/** 홈 화면에서 내 주간 공부시간과 반/캠퍼스 대비 순위를 보여주는 경쟁 대시보드. */
export function LeaderboardDashboard() {
  const { chartTargetRef, isStudying } = useStudyTimer();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const wasStudying = useRef(isStudying);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  // 공부 종료 직후(슬라임이 그래프에 도착할 즈음) 최신 수치로 다시 불러와 그래프가 실제로 올라가게 한다.
  useEffect(() => {
    if (wasStudying.current && !isStudying) {
      const timer = setTimeout(() => {
        fetchDashboard()
          .then(setData)
          .catch(() => {});
      }, 500);
      wasStudying.current = isStudying;
      return () => clearTimeout(timer);
    }
    wasStudying.current = isStudying;
  }, [isStudying]);

  if (!data) return null;

  const maxAvg = Math.max(...data.campus_progress.map((c) => c.avg_seconds), 1);

  return (
    <div className="card mt-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">이번 주 내 공부시간</p>
        <p className="text-2xl font-extrabold text-gray-900">{formatHours(data.my_weekly_seconds)}시간</p>
      </div>

      {!data.qualifies_this_week && (
        <p className="text-xs text-amber-600">
          주 10시간을 채워야 반/캠퍼스 순위 포인트 대상이 돼요. (현재 {formatHours(data.my_weekly_seconds)}시간)
        </p>
      )}

      {(data.individual_rank_in_class || data.class_rank_in_campus || data.campus_rank_overall) && (
        <div className="flex flex-wrap gap-2 text-sm">
          {data.individual_rank_in_class && (
            <span className="rounded-full bg-primary-50 px-3 py-1 font-bold text-primary-700">
              우리반 {data.individual_rank_in_class.rank}위 / {data.individual_rank_in_class.total}명
            </span>
          )}
          {data.class_rank_in_campus && (
            <span className="rounded-full bg-primary-50 px-3 py-1 font-bold text-primary-700">
              캠퍼스 내 우리반 {data.class_rank_in_campus.rank}위
            </span>
          )}
          {data.campus_rank_overall && (
            <span className="rounded-full bg-primary-50 px-3 py-1 font-bold text-primary-700">
              전체 캠퍼스 {data.campus_rank_overall.rank}위
            </span>
          )}
        </div>
      )}

      {!data.individual_rank_in_class && (
        <p className="text-xs text-gray-400">아직 소속된 반이 없어요. 마이페이지에서 반 배정을 확인해보세요.</p>
      )}

      <div>
        <p className="mb-2 text-xs text-gray-500">캠퍼스별 1인당 평균 공부시간 (공정 비교)</p>
        {data.campus_progress.map((c) => (
          <div key={c.campus} className="mb-1 flex items-center gap-2">
            <span className="w-12 text-xs text-gray-600">{c.label}</span>
            <div className="h-2 flex-1 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-primary-500"
                style={{ width: `${(c.avg_seconds / maxAvg) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs text-gray-500">{formatHours(c.avg_seconds)}h</span>
          </div>
        ))}
      </div>

      {/*
        chartTargetRef: 공부 종료 시 스톱워치 위젯이 여기로 슬라임 애니메이션을 날리고, 도착하면 이 요소를 "띵" 튕긴다.
        데이터가 없을 때(이번 주 첫 세션 등)도 항상 렌더링해야, 그 첫 세션에서도 도착 지점이 있어 애니메이션이 뜬다.
      */}
      <div ref={chartTargetRef} className="rounded-xl">
        {data.my_daily_breakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data.my_daily_breakdown}>
              <XAxis dataKey="log_date" tickFormatter={(d: string) => d.slice(5)} fontSize={11} />
              <YAxis tickFormatter={(s: number) => formatHours(s)} fontSize={11} width={30} />
              <Tooltip formatter={(value) => `${formatHours(Number(value))}시간`} />
              <Bar dataKey="seconds" fill="#EA5B0C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[120px] items-center justify-center text-xs text-gray-300">
            이번 주 기록이 쌓이면 그래프가 여기 나타나요
          </div>
        )}
      </div>
    </div>
  );
}
