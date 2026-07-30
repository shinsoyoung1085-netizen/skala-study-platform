import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { to: "/home", label: "홈" },
  { to: "/studies", label: "스터디" },
  { to: "/my-studies", label: "내 스터디" },
  { to: "/curriculum", label: "교육과정" },
  { to: "/feed", label: "정보공유" },
  { to: "/feedback", label: "후기/건의" },
  { to: "/mypage", label: "마이페이지" },
];

/** 로그인 후 진입하는 모든 페이지 상단에 표시되는 공용 내비게이션 바. */
export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const linkClass = (isActive: boolean) =>
    [
      "rounded-full px-4 py-2 text-sm font-medium transition-colors",
      isActive ? "bg-primary-50 text-primary" : "text-gray-600 hover:bg-gray-100",
    ].join(" ");

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          className="text-lg font-extrabold tracking-tight text-gray-900"
          onClick={() => navigate("/home")}
        >
          SKALA <span className="text-primary">STUDY</span>
        </button>

        {/* 데스크탑 메뉴 */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => linkClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
          {user?.is_admin && (
            <NavLink to="/admin" className={({ isActive }) => linkClass(isActive)}>
              관리자
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="text-sm text-gray-500">{user?.name}님</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="메뉴 열기"
        >
          <div className="flex flex-col gap-1">
            <span className="h-0.5 w-5 bg-gray-700" />
            <span className="h-0.5 w-5 bg-gray-700" />
            <span className="h-0.5 w-5 bg-gray-700" />
          </div>
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-gray-100 px-4 py-3 md:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => linkClass(isActive)}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          {user?.is_admin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => linkClass(isActive)}
              onClick={() => setMenuOpen(false)}
            >
              관리자
            </NavLink>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm text-gray-500">{user?.name}님</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
