import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Bot } from "lucide-react";

export type AppMode = "dashboard" | "agent";

interface ModeToggleProps {
  compact?: boolean;
}

export default function ModeToggle({ compact = false }: ModeToggleProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Route-driven: /app => agent mode, everything else => dashboard mode.
  // On first login the user lands on /dashboard, so dashboard is the default.
  const mode: AppMode = pathname.startsWith("/app") ? "agent" : "dashboard";

  const select = useCallback(
    (next: AppMode) => {
      if (next === mode) return;
      navigate(next === "agent" ? "/app" : "/dashboard");
    },
    [mode, navigate],
  );

  const btn = (value: AppMode, label: string, Icon: typeof LayoutDashboard) => {
    const active = mode === value;
    return (
      <button
        onClick={() => select(value)}
        className={`flex items-center gap-1.5 rounded-full transition-all cursor-pointer ${
          compact ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-xs"
        } font-bold uppercase tracking-wider ${
          active ? "bg-white text-black" : "text-white/60 hover:text-white"
        }`}
        aria-pressed={active}
      >
        <Icon className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        {label}
      </button>
    );
  };

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md p-1"
      role="tablist"
      aria-label="Dashboard or Agent mode"
    >
      {btn("dashboard", "Dashboard", LayoutDashboard)}
      {btn("agent", "Agent", Bot)}
    </div>
  );
}
