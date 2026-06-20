import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, ShoppingBag, Utensils, ChefHat, Package, Tag, CreditCard,
  Grid3x3, Users, Calendar, BarChart3, Sparkles, Map, FlaskConical, Database,
  Settings, LogOut, Coffee, ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const NAV: Record<string, NavItem[]> = {
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/categories", label: "Categories", icon: Tag },
    { to: "/admin/tables", label: "Floors & Tables", icon: Grid3x3 },
    { to: "/admin/payments", label: "Payment Methods", icon: CreditCard },
    { to: "/admin/coupons", label: "Coupons", icon: Tag },
    { to: "/admin/employees", label: "Employees", icon: Users },
    { to: "/admin/bookings", label: "Bookings", icon: Calendar },
    { to: "/admin/ingredients", label: "Ingredients", icon: ChefHat },
    { to: "/admin/predictions", label: "Predictive Insights", icon: Sparkles },
    { to: "/admin/simulation", label: "Simulation Lab", icon: FlaskConical },
    { to: "/admin/map", label: "Map Intelligence", icon: Map },
    { to: "/admin/ai", label: "AI Assistant", icon: Sparkles },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    { to: "/admin/dataset", label: "Prediction Dataset", icon: Database },
    { to: "/pos", label: "POS Terminal", icon: ShoppingBag },
    { to: "/kds", label: "Kitchen Display", icon: Utensils },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ],
  cashier: [
    { to: "/pos", label: "POS Terminal", icon: ShoppingBag },
    { to: "/pos/orders", label: "Orders", icon: ReceiptText },
    { to: "/kds", label: "Kitchen Display", icon: Utensils },
  ],
  kitchen: [
    { to: "/kds", label: "Kitchen Display", icon: Utensils },
  ],
  customer: [
    { to: "/customer", label: "Dashboard", icon: LayoutDashboard },
    { to: "/customer/menu", label: "Menu", icon: Utensils },
    { to: "/customer/orders", label: "Orders", icon: ReceiptText },
    { to: "/customer/rewards", label: "Rewards", icon: Sparkles },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const { role, user, signOut } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const items = NAV[role || "customer"] || [];

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-warm flex items-center justify-center shadow-warm">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-serif text-xl leading-none text-sidebar-foreground">DineFlow</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{role}</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
          {items.map(it => {
            const Icon = it.icon;
            const active = loc.pathname === it.to || (it.to !== "/" && loc.pathname.startsWith(it.to + "/"));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors",
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft" : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{it.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-2 pb-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => { await signOut(); toast.success("Signed out"); nav("/"); }}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
