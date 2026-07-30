import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { trackVisit } from "@/api/stats";
import { resolveFeatureKey } from "@/constants/appFeatures";
import { useAuth } from "@/hooks/useAuth";

/** 로그인한 상태로 경로가 바뀔 때마다 현재 화면(기능)을 방문 기록으로 남긴다 (관리자 이용 분석용). */
export function usePageViewTracking() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const feature = resolveFeatureKey(location.pathname);
    if (!feature || feature === lastTracked.current) return;

    lastTracked.current = feature;
    trackVisit(feature).catch(() => {});
  }, [isAuthenticated, location.pathname]);
}
