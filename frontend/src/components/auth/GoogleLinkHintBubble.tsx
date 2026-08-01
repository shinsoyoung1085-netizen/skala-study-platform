/**
 * 로그인 페이지의 Google 로그인 버튼 위에 뜨는 안내 말풍선.
 * 기존 아이디/비밀번호 계정이 있는 사용자가 구글로 로그인해서 중복 계정을 만들지 않도록,
 * 마이페이지에서 연동하는 방법을 안내한다.
 * 부모(.group)에 마우스를 올리면 나타나고, 벗어나면 사라진다 — 상태 없이 순수 CSS로 동작한다.
 */
export function GoogleLinkHintBubble() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-0 z-10 w-full max-w-[280px] -translate-x-1/2 -translate-y-[calc(100%+10px)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      <div className="relative rounded-2xl border border-primary-200 bg-white px-4 py-3 shadow-lg">
        <p className="text-sm font-bold text-gray-900">💡 기존 계정과 연동하고 싶으신가요?</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          일반 로그인 후 <span className="font-semibold text-primary">마이페이지</span>에서 구글 계정을 연동해
          주세요!
        </p>

        {/* 아래쪽 Google 버튼을 가리키는 화살표 */}
        <div className="absolute -bottom-[7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-b border-r border-primary-200 bg-white" />
      </div>
    </div>
  );
}
