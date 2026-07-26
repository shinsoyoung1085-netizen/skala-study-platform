import { Link } from "react-router-dom";

import { Button } from "@/components/common/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-extrabold text-gray-900">404</h1>
      <p className="text-sm text-gray-500">페이지를 찾을 수 없습니다.</p>
      <Link to="/">
        <Button>홈으로 돌아가기</Button>
      </Link>
    </div>
  );
}
