// 회원가입/마이페이지의 캠퍼스 선택지.
// code는 백엔드 Campus enum(app/models/enums.py)과 반드시 일치해야 한다.
import type { OptionItem } from "@/types";

export const CAMPUS_OPTIONS: OptionItem[] = [
  { code: "PANGYO", label: "판교" },
  { code: "GWANGJU", label: "광주" },
  { code: "ULSAN", label: "울산" },
];
