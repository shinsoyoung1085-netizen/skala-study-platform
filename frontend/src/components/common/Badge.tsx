import type { ReactNode } from "react";

type Tone = "primary" | "neutral" | "success" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary-50 text-primary-700",
  neutral: "bg-gray-100 text-gray-600",
  success: "bg-green-50 text-green-700",
  danger: "bg-red-50 text-red-600",
};

/** 카테고리, 상태 등을 표시하는 작은 태그(pill) 컴포넌트. */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
