import { useRef, useState } from "react";

export type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "error";

interface UseAvailabilityCheckOptions {
  /** 이 값과 똑같으면 검사를 건너뛰고 idle로 둔다 (마이페이지에서 "지금 내 값 그대로"인 경우 등). */
  skipValue?: string;
}

/**
 * 아이디/이메일 등의 중복 확인 상태를 관리하는 훅.
 * 응답이 늦게 와서 그 사이 값이 바뀐 경우(오래된 응답)는 무시하고,
 * 네트워크 오류/타임아웃 시에는 "checking"에 멈춰있지 않고 "error"로 확실히 알린다.
 */
export function useAvailabilityCheck(
  checker: (value: string) => Promise<boolean>,
  options?: UseAvailabilityCheckOptions,
) {
  const [status, setStatus] = useState<AvailabilityStatus>("idle");
  const lastRequestedValue = useRef<string | null>(null);

  const check = async (value: string) => {
    if (!value || value === options?.skipValue) {
      lastRequestedValue.current = null;
      setStatus("idle");
      return;
    }

    lastRequestedValue.current = value;
    setStatus("checking");
    try {
      const available = await checker(value);
      if (lastRequestedValue.current === value) {
        setStatus(available ? "available" : "taken");
      }
    } catch {
      if (lastRequestedValue.current === value) {
        setStatus("error");
      }
    }
  };

  const reset = () => {
    lastRequestedValue.current = null;
    setStatus("idle");
  };

  return { status, check, reset };
}
