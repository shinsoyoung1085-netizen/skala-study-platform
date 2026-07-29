// 역량 프로필(분야별 이해도) 선택지.
// code는 백엔드 SkillLevel enum(app/models/enums.py)과 반드시 일치해야 한다.
import type { OptionItem } from "@/types";

export const SKILL_LEVEL_OPTIONS: OptionItem[] = [
  { code: "HIGH", label: "상" },
  { code: "MEDIUM", label: "중" },
  { code: "LOW", label: "하" },
];
