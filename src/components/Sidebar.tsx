import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const updateProfile = () => {
      const userId = localStorage.getItem("bys_user_id");
      const loc = userId
        ? localStorage.getItem(`bys_user_location_${userId}`) ?? localStorage.getItem("bys_user_location")
        : localStorage.getItem("bys_user_location");
      setProfile(loc ? { location: loc } : null);
    };

    updateProfile();
    const interval = setInterval(updateProfile, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar flex flex-col p-5">
      <div className="flex items-center gap-2 px-2 mb-10">
        <img src="/logo.png" alt="beforeyousign" className="w-9 h-9 object-contain" />
        <span className="font-semibold text-lg tracking-tight">beforeyousign</span>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active =
            location.pathname === to ||
            (to === "/dashboard" && location.pathname === "/");
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-smooth",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto p-4 rounded-2xl bg-card border border-border">
        {profile?.location ? (
          <>
            <div className="w-8 h-8 rounded-full bg-primary/20 grid place-items-center mb-2">
              <span className="text-primary text-sm font-semibold">
                {profile.location.charAt(0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-0.5">Your location</p>
            <p className="text-sm font-medium truncate">{profile.location}</p>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-1">Pro tip</p>
            <p className="text-sm leading-relaxed">Always read what you sign. Or… just let us do it.</p>
          </>
        )}
      </div>
    </aside>
  );
};
