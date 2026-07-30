import type { AvailabilityStatus } from "@/hooks/useAvailabilityCheck";

/** 아이디/이메일 중복 확인 상태를 입력칸 아래에 짧은 문구로 보여준다. */
export function AvailabilityHint({ status }: { status: AvailabilityStatus }) {
  if (status === "checking") return <span className="text-xs text-gray-400">확인 중...</span>;
  if (status === "available") return <span className="text-xs text-green-600">사용 가능합니다</span>;
  if (status === "taken") return <span className="text-xs text-red-500">이미 사용 중입니다</span>;
  if (status === "error") {
    return <span className="text-xs text-amber-600">확인에 실패했어요. 다른 칸을 눌렀다가 다시 클릭해주세요.</span>;
  }
  return null;
}
