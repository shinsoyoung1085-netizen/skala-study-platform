import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";

/** 로그인이 필요한 페이지를 감싸는 라우트 가드. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner label="로그인 상태를 확인하는 중입니다..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/** 관리자만 접근할 수 있는 페이지를 감싸는 라우트 가드. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner label="권한을 확인하는 중입니다..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.is_admin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
