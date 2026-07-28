// 업데이트 공지 카테고리 선택지.
// code는 백엔드 UpdateCategory enum(app/models/enums.py)과 반드시 일치해야 한다.
import type { OptionItem } from "@/types";

export const UPDATE_CATEGORY_OPTIONS: OptionItem[] = [
  { code: "FEATURE", label: "신규 기능" },
  { code: "BUGFIX", label: "버그 수정" },
  { code: "IMPROVEMENT", label: "개선 사항" },
  { code: "NOTICE", label: "공지" },
];
