import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/** 공용 텍스트 입력 필드. 라벨/에러 메시지/보조 설명을 함께 표시할 수 있다. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = "", ...rest },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={[
          "w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors",
          "placeholder:text-gray-400",
          error
            ? "border-red-400 focus:border-red-500"
            : "border-gray-200 focus:border-primary",
          className,
        ].join(" ")}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
});
