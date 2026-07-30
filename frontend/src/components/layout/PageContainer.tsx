import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/Navbar";
import { StudyTimerWidget } from "@/components/layout/StudyTimerWidget";

/** Navbar + 공통 여백을 적용한 페이지 레이아웃 래퍼. 로그인 후 모든 페이지에서 공부 타이머 위젯을 함께 띄운다. */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      <StudyTimerWidget />
    </div>
  );
}
