import type { OptionItem, StudyFilters } from "@/types";

interface StudyFilterBarProps {
  filters: StudyFilters;
  onChange: (filters: StudyFilters) => void;
  categoryOptions: OptionItem[];
  dayOptions: OptionItem[];
  locationOptions: OptionItem[];
}

/** 스터디 목록 상단의 검색어 + 카테고리/요일/장소/온라인여부 필터 바. 모든 조건은 동시에 적용된다. */
export function StudyFilterBar({
  filters,
  onChange,
  categoryOptions,
  dayOptions,
  locationOptions,
}: StudyFilterBarProps) {
  const update = (patch: Partial<StudyFilters>) => onChange({ ...filters, ...patch });

  const selectClass =
    "rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none focus:border-primary";

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="스터디명을 검색해보세요"
        value={filters.keyword ?? ""}
        onChange={(e) => update({ keyword: e.target.value })}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
      />

      <div className="flex flex-wrap gap-2">
        <select
          className={selectClass}
          value={filters.category ?? ""}
          onChange={(e) => update({ category: e.target.value || undefined })}
        >
          <option value="">전체 카테고리</option>
          {categoryOptions.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filters.day_of_week ?? ""}
          onChange={(e) => update({ day_of_week: e.target.value || undefined })}
        >
          <option value="">전체 요일</option>
          {dayOptions.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.label}요일
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filters.location ?? ""}
          onChange={(e) => update({ location: e.target.value || undefined })}
        >
          <option value="">전체 장소</option>
          {locationOptions.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filters.is_online === undefined ? "" : String(filters.is_online)}
          onChange={(e) =>
            update({ is_online: e.target.value === "" ? undefined : e.target.value === "true" })
          }
        >
          <option value="">온라인/오프라인</option>
          <option value="true">온라인</option>
          <option value="false">오프라인</option>
        </select>
      </div>
    </div>
  );
}
