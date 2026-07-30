// 후기/건의 분류 선택지. code는 백엔드 FeedbackCategory enum(app/models/enums.py)과 반드시 일치해야 한다.
import type { OptionItem } from "@/types";

export const FEEDBACK_CATEGORY_OPTIONS: OptionItem[] = [
  { code: "PRAISE", label: "칭찬" },
  { code: "SUGGESTION", label: "건의" },
  { code: "BUG", label: "버그 제보" },
  { code: "ETC", label: "기타" },
];
