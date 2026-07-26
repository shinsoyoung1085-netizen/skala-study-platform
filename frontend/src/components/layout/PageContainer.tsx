import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/Navbar";

/** Navbar + 공통 여백을 적용한 페이지 레이아웃 래퍼. */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
