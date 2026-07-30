import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { sendHeartbeat } from "@/api/leaderboard";

const STORAGE_KEY = "skala_study_timer_running";
const HEARTBEAT_INTERVAL_MS = 30_000;

interface StudyTimerContextValue {
  isStudying: boolean;
  todaySeconds: number;
  start: () => void;
  stop: () => void;
}

const StudyTimerContext = createContext<StudyTimerContextValue | null>(null);

/** 로그인한 유저 전역에서 공부 시작/종료 상태와 오늘 누적 시간을 관리하는 컨텍스트. */
export function StudyTimerProvider({ children }: { children: ReactNode }) {
  const [isStudying, setIsStudying] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");
  const [todaySeconds, setTodaySeconds] = useState(0);
  const lastTick = useRef<number>(Date.now());

  useEffect(() => {
    if (!isStudying) return;
    lastTick.current = Date.now();

    const id = setInterval(() => {
      if (document.hidden) return; // 다른 탭을 보는 중이면 이번 틱은 건너뛴다 (어뷰징 방지)
      const now = Date.now();
      const elapsed = Math.round((now - lastTick.current) / 1000);
      lastTick.current = now;
      sendHeartbeat(elapsed)
        .then((res) => setTodaySeconds(res.today_seconds))
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
    setIsStudying(true);
    localStorage.setItem(STORAGE_KEY, "1");
  };
  const stop = () => {
    setIsStudying(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <StudyTimerContext.Provider value={{ isStudying, todaySeconds, start, stop }}>
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
