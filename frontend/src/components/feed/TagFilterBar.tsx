interface TagFilterBarProps {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}

/** 정보 공유 피드 상단의 태그 필터 칩 바. 여러 개 선택 시 OR 조건으로 필터링된다. */
export function TagFilterBar({ tags, selected, onToggle }: TagFilterBarProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isActive = selected.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            #{tag}
          </button>
        );
      })}
    </div>
  );
}
