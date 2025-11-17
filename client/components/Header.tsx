import { Link, useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();
  const showOrderPage =
    location.pathname === "/admin" || location.pathname === "/dashboard";

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-[#E2E8F0] bg-white">
      <Link
        to="/"
        className="text-[#009966] text-base leading-6 font-normal hover:opacity-80 transition-opacity"
      >
        NEXPOINT
      </Link>
      <div className="flex items-center gap-4">
        {showOrderPage && (
          <Link
            to="/"
            className="text-[#45556C] text-base leading-6 font-normal hover:text-[#009966] transition-colors"
          >
            Order Page
          </Link>
        )}
      </div>
    </header>
  );
}
