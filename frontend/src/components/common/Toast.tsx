import { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  durationMs?: number;
}

/** 화면 하단에 잠깐 떴다 사라지는 확인 토스트. */
export function Toast({ message, onClose, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
      {message}
    </div>
  );
}
