import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { logout } from "../utils/auth";

interface UserMenuProps {
  compact?: boolean;
}

export default function UserMenu({ compact }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.top - 8, left: rect.left });
    }
    setOpen(!open);
  };

  const dropdownMenu = open
    ? createPortal(
        <div
          ref={menuRef}
          className="fixed bg-white border rounded-md shadow-lg py-1 w-36 z-[9999]"
          style={{ top: menuPos.top, left: menuPos.left, transform: 'translateY(-100%)' }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>,
        document.body,
      )
    : null;

  if (compact) {
    return (
      <>
        <button
          ref={btnRef}
          onClick={handleToggle}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#4cd964] text-white font-semibold text-sm hover:opacity-80 transition-opacity cursor-pointer"
        >
          A
        </button>
        {dropdownMenu}
      </>
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-3 w-full px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#4cd964] flex items-center justify-center text-white font-semibold text-sm">
          A
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1c1c1e] truncate">Admin</p>
          <p className="text-xs text-gray-500 truncate">admin</p>
        </div>
      </button>
      {dropdownMenu}
    </>
  );
}
