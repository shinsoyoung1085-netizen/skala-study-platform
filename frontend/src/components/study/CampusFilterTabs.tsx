interface CampusTab {
  code?: string;
  label: string;
  emoji?: string;
  /** 활성 상태일 때 적용할 배경/글자 클래스 (캠퍼스별 고유 색상) */
  activeClass: string;
}

const TABS: CampusTab[] = [
  { code: undefined, label: "전체", activeClass: "bg-gray-900 text-white border-gray-900" },
  { code: "PANGYO", label: "판교", emoji: "🧡", activeClass: "bg-primary text-white border-primary" },
  { code: "GWANGJU", label: "광주", emoji: "💙", activeClass: "bg-blue-500 text-white border-blue-500" },
  { code: "ULSAN", label: "울산", emoji: "💜", activeClass: "bg-purple-500 text-white border-purple-500" },
];

interface CampusFilterTabsProps {
  value?: string;
  onChange: (campus?: string) => void;
}

/** 스터디 목록 상단의 캠퍼스 필터 탭. 검색창 아래, 세부 필터 위에서 캠퍼스를 크게 강조해 선택할 수 있게 한다. */
export function CampusFilterTabs({ value, onChange }: CampusFilterTabsProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {TABS.map((tab) => {
        const isActive = value === tab.code;
        return (
          <button
            key={tab.label}
            type="button"
            onClick={() => onChange(tab.code)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              isActive
                ? `${tab.activeClass} shadow-sm`
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {tab.emoji && <span>{tab.emoji}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
