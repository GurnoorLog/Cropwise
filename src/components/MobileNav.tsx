import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Newspaper, Bot, Settings, CloudSun } from "lucide-react";

const ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/weather", label: "Weather", icon: CloudSun },
  { to: "/news", label: "Forecasts", icon: Newspaper },
  { to: "/app", label: "Ask AI", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#171310]/90 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                active ? "text-white" : "text-white/40 hover:text-white/80"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
