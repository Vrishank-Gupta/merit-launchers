import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Wallet,
  Trophy,
  Target,
  FolderOpen,
  LogOut,
  ChevronRight,
  Rocket,
  GitBranch,
  UserCog,
  ClipboardList,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { to: "/partner", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/partner/students", label: "My Students", icon: Users },
  { to: "/partner/network", label: "My Network", icon: GitBranch },
  { to: "/partner/sales", label: "Sales & Revenue", icon: TrendingUp },
  { to: "/partner/commission", label: "Commission", icon: Wallet },
  { to: "/partner/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/partner/milestones", label: "Milestones", icon: Target },
  { to: "/partner/leads", label: "Leads", icon: ClipboardList },
  { to: "/partner/toolkit", label: "Toolkit", icon: FolderOpen },
  { to: "/partner/account", label: "Account", icon: UserCog },
];

export default function PartnerLayout() {
  const { isLoggedIn, signOut, affiliate } = usePartnerAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/partner/login", { replace: true });
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-left transition-opacity hover:opacity-90"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">Merit Launchers</p>
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
              {affiliate?.name || "Partner"}
            </p>
          </div>
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="mb-3 px-1 space-y-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Referral Code</p>
            <code className="text-sm font-semibold text-primary">{affiliate?.code}</code>
          </div>
          {affiliate?.code && (
            <>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/ref/${affiliate.code}`).catch(() => {})}
                className="w-full text-left text-xs px-2 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                📎 Copy Student Link
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${affiliate.code}`).catch(() => {})}
                className="w-full text-left text-xs px-2 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                🤝 Copy Partner Link
              </button>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={() => {
            signOut();
            navigate("/partner/login");
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col shadow-sm flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border flex flex-col shadow-lg transform transition-transform duration-200 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-3 right-3">
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="p-1 rounded text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Partner Portal</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
