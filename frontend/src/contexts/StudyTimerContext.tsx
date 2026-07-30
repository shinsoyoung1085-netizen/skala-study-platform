import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";

import { fetchTodaySeconds, sendHeartbeat } from "@/api/leaderboard";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "skala_study_timer_running";
const HEARTBEAT_INTERVAL_MS = 30_000;

interface StudyTimerContextValue {
  isStudying: boolean;
  todaySeconds: number;
  start: () => void;
  /** 종료 시 마지막 자투리 시간까지 서버에 반영하고, 이번에 추가로 기여한 초를 반환한다(애니메이션 연출용). */
  stop: () => number;
  /**
   * 홈 화면의 일별 공부시간 그래프 DOM 노드를 가리키는 공유 ref.
   * 그래프가 화면에 있으면(LeaderboardDashboard가 마운트되어 있으면) 이 ref에 노드가 채워지고,
   * 스톱워치 위젯은 종료 시 이 위치로 슬라임 애니메이션을 날린다. 그래프가 없는 페이지에서는 null.
   */
  chartTargetRef: MutableRefObject<HTMLDivElement | null>;
}

const StudyTimerContext = createContext<StudyTimerContextValue | null>(null);

/** 로그인한 유저 전역에서 공부 시작/종료 상태와 오늘 누적 시간을 관리하는 컨텍스트. */
export function StudyTimerProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isStudying, setIsStudying] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");
  // 서버가 실제로 확정한 값(30초 하트비트 응답 또는 최초 조회로 갱신) - 캡핑/정합성의 기준.
  const [serverSeconds, setServerSeconds] = useState(0);
  // 화면에 보여주는 값(1초마다 증가) - serverSeconds가 갱신될 때마다 그 값으로 재동기화된다.
  const [todaySeconds, setTodaySeconds] = useState(0);
  const lastTick = useRef<number>(Date.now());
  const sessionStart = useRef<number | null>(null);
  const chartTargetRef = useRef<HTMLDivElement | null>(null);

  // 로그인 직후(또는 새로고침 후) 오늘 이미 쌓여있던 공부시간을 불러와 0부터 시작하지 않게 한다.
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTodaySeconds()
      .then((res) => setServerSeconds(res.today_seconds))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    setTodaySeconds(serverSeconds);
  }, [serverSeconds]);

  // 초 단위로 화면 숫자만 올려주는 타이머 (실제 기록은 하트비트가 담당, 이건 스톱워치 느낌을 위한 표시용).
  useEffect(() => {
    if (!isStudying) return;
    const id = setInterval(() => {
      if (document.hidden) return; // 다른 탭을 보는 중이면 화면도 멈춰서 하트비트와 어긋나지 않게 한다.
      setTodaySeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isStudying]);

  useEffect(() => {
    if (!isStudying) return;
    lastTick.current = Date.now();

    const id = setInterval(() => {
      if (document.hidden) return; // 다른 탭을 보는 중이면 이번 틱은 건너뛴다 (어뷰징 방지)
      const now = Date.now();
      const elapsed = Math.round((now - lastTick.current) / 1000);
      lastTick.current = now;
      sendHeartbeat(elapsed)
        .then((res) => setServerSeconds(res.today_seconds))
        .catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(id);
  }, [isStudying]);

  useEffect(() => {
    const handleUnload = () => localStorage.removeItem(STORAGE_KEY);
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  const start = () => {
    sessionStart.current = Date.now();
    setIsStudying(true);
    localStorage.setItem(STORAGE_KEY, "1");
  };
  const stop = () => {
    // 마지막 하트비트 이후 ~ 지금 사이(최대 30초 미만)는 아직 서버에 반영 안 된 자투리 시간이라, 종료 시점에 한 번 더 보내서 유실을 막는다.
    const flushElapsed = Math.round((Date.now() - lastTick.current) / 1000);
    // 이번 세션 전체 길이(시작~종료) - 슬라임 애니메이션 등 연출에 쓰는 "이번에 기여한 시간".
    const sessionElapsed = sessionStart.current ? Math.round((Date.now() - sessionStart.current) / 1000) : 0;

    setIsStudying(false);
    localStorage.removeItem(STORAGE_KEY);
    sessionStart.current = null;

    if (flushElapsed > 0) {
      sendHeartbeat(flushElapsed)
        .then((res) => setServerSeconds(res.today_seconds))
        .catch(() => {});
    }
    return sessionElapsed;
  };

  return (
    <StudyTimerContext.Provider value={{ isStudying, todaySeconds, start, stop, chartTargetRef }}>
      {children}
    </StudyTimerContext.Provider>
  );
}

export function useStudyTimer() {
  const ctx = useContext(StudyTimerContext);
  if (!ctx) {
    throw new Error("useStudyTimer는 StudyTimerProvider 내부에서만 사용할 수 있습니다.");
  }
  return ctx;
}
