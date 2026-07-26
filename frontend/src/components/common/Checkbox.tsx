interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** 관심분야 등 다중 선택에 사용하는 체크박스 컴포넌트. */
export function Checkbox({ label, checked, onChange, disabled = false }: CheckboxProps) {
  return (
    <label
      className={[
        "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
        checked ? "border-primary bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600",
        disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary-300",
      ].join(" ")}
    >
      <input
        type="checkbox"
        className="h-4 w-4 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
