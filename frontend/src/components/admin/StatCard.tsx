interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

/** 관리자 대시보드 상단의 KPI 요약 카드. */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="card flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400">{label}</span>
      <span className="text-2xl font-extrabold text-gray-900" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
}
