import React from "react";
import { Link } from "react-router-dom";

interface NavbarProps {
  onSidebarToggle: () => void;
  showHamburger?: boolean;
  children?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({
  onSidebarToggle,
  showHamburger = true,
  children,
}) => {
  return (
    <nav className="w-full bg-[#18192a] border-b border-[#23243a] px-4 md:px-8 py-3 md:py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
      <Link
        to="/"
        className="text-lg md:text-3xl font-extrabold text-blue-400 tracking-tight hover:underline cursor-pointer"
      >
        Dashboard
      </Link>

      <div className="flex items-center gap-2 md:gap-4">
        {children}

        {/* Hamburger Menu Button - Mobile */}
        {showHamburger && (
          <button
            onClick={onSidebarToggle}
            className="md:hidden p-2 rounded-lg bg-[#23243a] hover:bg-[#2d2e4a] transition"
          >
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
