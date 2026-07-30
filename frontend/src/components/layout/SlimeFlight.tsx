import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SlimeFlightProps {
  from: Rect;
  to: Rect;
  onArrive: () => void;
}

const FLIGHT_MS = 650;

function centerOf(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** 스톱워치 버튼에서 그래프까지 날아가는 작은 슬라임 하나. 도착하면 onArrive를 호출하고 사라진다. */
export function SlimeFlight({ from, to, onArrive }: SlimeFlightProps) {
  const [pos, setPos] = useState(centerOf(from));

  useEffect(() => {
    // 다음 프레임에 목적지 좌표로 옮기면, CSS transition이 자연스럽게 "날아가는" 움직임을 만들어준다.
    const frame = requestAnimationFrame(() => setPos(centerOf(to)));
    const timer = setTimeout(onArrive, FLIGHT_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className="pointer-events-none fixed z-[60] h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-squish rounded-full bg-primary-500 shadow-lg"
      style={{
        left: pos.x,
        top: pos.y,
        transition: `left ${FLIGHT_MS}ms ease-in, top ${FLIGHT_MS}ms ease-in`,
      }}
    />,
    document.body,
  );
}
