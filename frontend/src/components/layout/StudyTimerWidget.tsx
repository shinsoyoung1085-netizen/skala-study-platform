import { useRef, useState } from "react";

import { SlimeFlight } from "@/components/layout/SlimeFlight";
import { useStudyTimer } from "@/contexts/StudyTimerContext";

interface Flight {
  id: number;
  from: DOMRect;
  to: DOMRect;
  seconds: number;
}

const BUMP_CLASS = "animate-bump";
const BUMP_MS = 450;
const LABEL_MS = 900;

function formatHMS(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}시간 ${m}분 ${s}초`;
}

/** "+15초"처럼 이번에 기여한 시간을 짧게 보여주는 라벨 문구. */
function formatContribution(seconds: number) {
  if (seconds < 60) return `+${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `+${m}분 ${s}초` : `+${m}분`;
}

/** 그래프 위치에 "+00초" 라벨을 잠깐 띄웠다가 사라지게 한다 (React 트리 밖, DOM에 직접 붙이는 일회성 연출). */
function popContributionLabel(targetRect: DOMRect, seconds: number) {
  const label = document.createElement("div");
  label.textContent = formatContribution(seconds);
  label.className =
    "pointer-events-none fixed z-[60] animate-float-fade rounded-full bg-primary-600 px-2 py-1 text-xs font-bold text-white shadow";
  label.style.left = `${targetRect.left + targetRect.width / 2 - 24}px`;
  label.style.top = `${targetRect.top - 8}px`;
  document.body.appendChild(label);
  setTimeout(() => label.remove(), LABEL_MS);
}

/** 앱 전체(로그인 후 모든 페이지)에서 항상 보이는 공부시간 시작/종료 버튼. */
export function StudyTimerWidget() {
  const { isStudying, todaySeconds, start, stop, chartTargetRef } = useStudyTimer();
  const widgetRef = useRef<HTMLDivElement>(null);
  const [flights, setFlights] = useState<Flight[]>([]);

  const handleStop = () => {
    const seconds = stop();
    const origin = widgetRef.current;
    const target = chartTargetRef.current;

    // 홈 화면(그래프가 있는 페이지)에 있을 때만 슬라임 애니메이션을 날린다. 다른 페이지면 조용히 종료만 한다.
    if (seconds > 0 && origin && target) {
      setFlights((prev) => [
        ...prev,
        { id: Date.now(), from: origin.getBoundingClientRect(), to: target.getBoundingClientRect(), seconds },
      ]);
    }
  };

  const handleArrive = (flight: Flight) => {
    setFlights((prev) => prev.filter((f) => f.id !== flight.id));

    const target = chartTargetRef.current;
    if (!target) return;

    target.classList.add(BUMP_CLASS);
    setTimeout(() => target.classList.remove(BUMP_CLASS), BUMP_MS);
    popContributionLabel(target.getBoundingClientRect(), flight.seconds);
  };

  return (
    <>
      <div
        ref={widgetRef}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-white px-4 py-3 shadow-lg"
      >
        <span className="text-sm font-bold text-gray-700">오늘 {formatHMS(todaySeconds)}</span>
        {isStudying ? (
          <button
            onClick={handleStop}
            className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-bold text-white"
          >
            공부 종료
          </button>
        ) : (
          <button
            onClick={start}
            className="rounded-full bg-primary-600 px-4 py-1.5 text-sm font-bold text-white"
          >
            공부 시작
          </button>
        )}
      </div>

      {flights.map((flight) => (
        <SlimeFlight key={flight.id} from={flight.from} to={flight.to} onArrive={() => handleArrive(flight)} />
      ))}
    </>
  );
}
