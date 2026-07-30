// 방문 추적용 라우트 -> 기능 키 매핑. 백엔드 app/models/enums.py의 AppFeature 값과 반드시 일치해야 한다.
const ROUTE_FEATURE_MAP: { prefix: string; feature: string }[] = [
  { prefix: "/home", feature: "HOME" },
  { prefix: "/studies", feature: "STUDIES" },
  { prefix: "/my-studies", feature: "MY_STUDIES" },
  { prefix: "/curriculum", feature: "CURRICULUM" },
  { prefix: "/feed", feature: "FEED" },
  { prefix: "/feedback", feature: "FEEDBACK" },
  { prefix: "/mypage", feature: "MYPAGE" },
  { prefix: "/admin", feature: "ADMIN" },
];

/** 현재 경로에 대응하는 추적 대상 기능 키를 찾는다. 매핑 밖의 경로(랜딩/로그인 등)는 null. */
export function resolveFeatureKey(pathname: string): string | null {
  const match = ROUTE_FEATURE_MAP.find((r) => pathname.startsWith(r.prefix));
  return match?.feature ?? null;
}
