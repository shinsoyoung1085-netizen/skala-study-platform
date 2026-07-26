/** 데이터 로딩 중임을 나타내는 공용 스피너. */
export function Spinner({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
