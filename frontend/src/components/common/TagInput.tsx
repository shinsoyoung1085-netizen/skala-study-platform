import { useState, type KeyboardEvent } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
}

/** 범용 다중 태그 칩 입력. Enter/쉼표로 태그를 추가하고, 칩의 ✕로 제거한다. */
export function TagInput({ value, onChange, label, placeholder = "태그 입력 후 Enter" }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const tag = draft.trim().replace(/^#/, "");
    if (!tag || value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-primary">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-primary-400 hover:text-primary-700"
              aria-label={`${tag} 태그 삭제`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 py-1 text-sm outline-none"
        />
      </div>
    </div>
  );
}
