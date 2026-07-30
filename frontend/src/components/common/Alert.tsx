import type { ReactNode } from "react";

type Tone = "error" | "success" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  error: "bg-red-50 text-red-600 border-red-100",
  success: "bg-green-50 text-green-700 border-green-100",
  info: "bg-primary-50 text-primary-700 border-primary-100",
};

/** 폼 에러/성공 메시지를 보여주는 배너. */
export function Alert({ tone = "error", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${TONE_CLASSES[tone]}`}>{children}</div>
  );
}
