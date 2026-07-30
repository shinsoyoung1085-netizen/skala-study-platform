import { useStudyTimer } from "@/contexts/StudyTimerContext";

function formatHMS(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}시간 ${m}분 ${s}초`;
}

/** 앱 전체(로그인 후 모든 페이지)에서 항상 보이는 공부시간 시작/종료 버튼. */
export function StudyTimerWidget() {
  const { isStudying, todaySeconds, start, stop } = useStudyTimer();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-white px-4 py-3 shadow-lg">
      <span className="text-sm font-bold text-gray-700">오늘 {formatHMS(todaySeconds)}</span>
      {isStudying ? (
        <button
          onClick={stop}
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
  );
}
