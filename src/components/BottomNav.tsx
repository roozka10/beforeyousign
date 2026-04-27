import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-sidebar/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 pb-safe">
      {items.map(({ to, label, icon: Icon }) => {
        const active =
          location.pathname === to ||
          (to === "/dashboard" && location.pathname === "/");
        return (
          <NavLink
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-1 px-5 py-3 rounded-2xl transition-smooth",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5", active && "scale-110 transition-transform")} />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
