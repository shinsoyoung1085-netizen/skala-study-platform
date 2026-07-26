import type { OptionItem } from "@/types";

interface DayToggleProps {
  options: OptionItem[];
  selected: Set<string>;
  onToggle: (code: string) => void;
}

/**
 * 요일을 각각 눌러서 선택/해제하는 토글 버튼 그룹.
 * 월수금, 주말, 매일 등 원하는 조합을 자유롭게 선택할 수 있다.
 */
export function DayToggle({ options, selected, onToggle }: DayToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.has(option.code);
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => onToggle(option.code)}
            aria-pressed={isSelected}
            className={[
              "h-10 w-10 rounded-full text-sm font-semibold transition-colors",
              isSelected
                ? "bg-primary text-white"
                : "border border-gray-200 text-gray-500 hover:border-primary hover:text-primary",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
