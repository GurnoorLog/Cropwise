import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "../lib/auth";

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface UserMenuProps {
  subtitle?: string;
  size?: "sm" | "md";
}

export default function UserMenu({ subtitle, size = "md" }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fullName =
    (user?.user_metadata?.full_name as string) ??
    (user?.user_metadata?.name as string) ??
    user?.email ??
    "Farmer";
  const initials = getInitials(fullName);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const avatarClasses =
    size === "sm"
      ? "w-8 h-8 text-[10px]"
      : "w-10 h-10 text-sm";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <div
          className={`${avatarClasses} rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-white font-bold group-hover:border-white/40 transition-colors`}
        >
          {initials}
        </div>
        {size === "md" && (
          <ChevronDown
            className={`w-4 h-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#171310]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden fade-rise"
        >
          <div className="px-5 py-4 border-b border-white/10">
            <p className="text-sm font-semibold text-white truncate">{fullName}</p>
            <p className="text-[11px] text-white/40 truncate mt-0.5">{user?.email}</p>
            {subtitle ? (
              <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1.5">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="py-2">
            <Link
              to="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-5 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings className="w-4 h-4 text-white/50" />
              Settings
            </Link>
            <button
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                await signOut();
                navigate("/");
              }}
              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-300/90 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
