import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Star,
  Briefcase,
  Bot,
  GitCompare,
  PiggyBank,
  User,
} from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/stocks", label: "Stock Explorer", icon: TrendingUp },
  { to: "/watchlist", label: "Watchlist", icon: Star },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/ai-advisor", label: "AI Advisor", icon: Bot },
  { to: "/compare", label: "Compare Stocks", icon: GitCompare },
  { to: "/sip-calculator", label: "SIP Calculator", icon: PiggyBank },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-slate-200 lg:dark:border-slate-800 lg:bg-white lg:dark:bg-surface-dark lg:min-h-[calc(100vh-4rem)] lg:sticky lg:top-16">
      <nav className="flex flex-col gap-1 p-4">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
