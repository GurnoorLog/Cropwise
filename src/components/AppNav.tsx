import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import ModeToggle from "./ModeToggle";
import UserMenu from "./UserMenu";

const NAV = [
  { to: "/dashboard", label: "Overview" },
  { to: "/weather", label: "Weather" },
  { to: "/news", label: "Markets" },
  { to: "/calendar", label: "Calendar" },
  { to: "/schemes", label: "Schemes" },
];

interface AppNavProps {
  right?: ReactNode;
  subtitle?: string;
}

export default function AppNav({ right, subtitle }: AppNavProps) {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-transparent">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="font-serif text-2xl text-white tracking-tight">
            Harvest Window
          </Link>
          <ModeToggle compact />
          <div className="hidden lg:flex items-center gap-7">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`text-xs font-bold uppercase tracking-widest transition-all ${
                  pathname === n.to ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          {right}
          <button
            aria-label="Notifications"
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
          </button>
          <UserMenu size="sm" subtitle={subtitle} />
        </div>
      </div>
    </nav>
  );
}
