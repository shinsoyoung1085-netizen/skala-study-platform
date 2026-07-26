// 회원가입 화면의 관심분야 체크박스 그룹 정의.
// code는 백엔드 CategoryCode(app/models/enums.py)와 반드시 일치해야 한다.
export interface InterestGroup {
  title: string;
  items: { code: string; label: string }[];
}

export const INTEREST_LABELS: Record<string, string> = {
  OPIC: "OPIC",
  TOEIC: "TOEIC",
  TOEIC_SPEAKING: "TOEIC Speaking",
  SQLD: "SQLD",
  INFO_PROCESSING_WRITTEN: "정보처리기사 필기",
  INFO_PROCESSING_PRACTICAL: "정보처리기사 실기",
  CLASS_STUDY: "수업스터디",
  ETC: "기타",
};

export const INTEREST_GROUPS: InterestGroup[] = [
  {
    title: "영어",
    items: [
      { code: "OPIC", label: "OPIC" },
      { code: "TOEIC", label: "TOEIC" },
      { code: "TOEIC_SPEAKING", label: "TOEIC Speaking" },
    ],
  },
  {
    title: "자격증",
    items: [
      { code: "SQLD", label: "SQLD" },
      { code: "INFO_PROCESSING_WRITTEN", label: "정보처리기사 필기" },
      { code: "INFO_PROCESSING_PRACTICAL", label: "정보처리기사 실기" },
    ],
  },
  {
    title: "기타",
    items: [
      { code: "CLASS_STUDY", label: "수업스터디" },
      { code: "ETC", label: "기타" },
    ],
  },
];
