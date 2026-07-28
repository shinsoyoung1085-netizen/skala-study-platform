import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { CampusBreakdownItem } from "@/utils/adminStats";

// 카테고리컬 색상은 항목(캠퍼스 코드)에 고정 배정한다 — 데이터가 없어 필터링되어도 순서가 밀리지 않도록.
const CAMPUS_COLORS: Record<string, string> = {
  PANGYO: "#2a78d6",
  GWANGJU: "#eb6834",
  ULSAN: "#1baf7a",
};

interface CampusDonutChartProps {
  data: CampusBreakdownItem[];
}

/** 캠퍼스별 회원 분포를 보여주는 도넛 차트. */
export function CampusDonutChart({ data }: CampusDonutChartProps) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-400">표시할 데이터가 없습니다.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius={64}
          outerRadius={92}
          paddingAngle={2}
          stroke="#fcfcfb"
          strokeWidth={2}
        >
          {data.map((item) => (
            <Cell key={item.code} fill={CAMPUS_COLORS[item.code] ?? "#898781"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, _name, entry) => [
            `${value}명 (${(entry.payload as CampusBreakdownItem).percentage}%)`,
            (entry.payload as CampusBreakdownItem).label,
          ]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e1e0d9", fontSize: 13 }}
        />
        <Legend
          verticalAlign="bottom"
          height={32}
          formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
