import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export const AppLayout = () => {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar: visible on md+ only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content — extra bottom padding on mobile so content clears the bottom nav */}
      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav: visible on mobile only */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
