// 모임장 익명 추천 시 선택하는 사전 정의 태그.
// code는 백엔드 RecommendationTag enum(app/models/enums.py)과 반드시 일치해야 한다.
import type { OptionItem } from "@/types";

export const RECOMMENDATION_TAG_OPTIONS: OptionItem[] = [
  { code: "KIND", label: "친절해요 👏" },
  { code: "LEADERSHIP", label: "리더십이 좋아요 👑" },
  { code: "PASSIONATE", label: "열정적이에요 🔥" },
];

export const RECOMMENDATION_POINTS = 50;
