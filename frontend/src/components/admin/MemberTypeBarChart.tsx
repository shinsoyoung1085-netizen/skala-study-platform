import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface MemberTypeBarChartProps {
  adminCount: number;
  regularCount: number;
}

/** 관리자 / 일반회원 구성비를 보여주는 막대 차트. */
export function MemberTypeBarChart({ adminCount, regularCount }: MemberTypeBarChartProps) {
  const data = [
    { label: "일반회원", count: regularCount, color: "#2a78d6" },
    { label: "관리자", count: adminCount, color: "#eb6834" },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: "#c3c2b7" }}
          tick={{ fill: "#898781", fontSize: 13 }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#898781", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "#f9f9f7" }}
          formatter={(value) => [`${value}명`, "인원"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e1e0d9", fontSize: 13 }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
          {data.map((item) => (
            <Cell key={item.label} fill={item.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
