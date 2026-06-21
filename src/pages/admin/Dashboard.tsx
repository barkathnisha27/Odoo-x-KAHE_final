import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore, formatINR } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee, ShoppingBag, TrendingUp, Grid3x3, ChefHat, AlertTriangle,
  Package, Award, Clock, Sparkles, Map as MapIcon, Truck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { DemoBadge } from "@/components/DemoBadge";
import { dedupeProducts, dedupeByKey } from "@/lib/dedupe";


const HOUR_DATA = [
  { hour: "10am", orders: 4 }, { hour: "11am", orders: 6 }, { hour: "12pm", orders: 12 },
  { hour: "1pm", orders: 18 }, { hour: "2pm", orders: 14 }, { hour: "3pm", orders: 8 },
  { hour: "4pm", orders: 10 }, { hour: "5pm", orders: 16 }, { hour: "6pm", orders: 22 },
  { hour: "7pm", orders: 26 }, { hour: "8pm", orders: 20 }, { hour: "9pm", orders: 12 },
];

const SALES_TREND = [
  { day: "Mon", revenue: 8400 }, { day: "Tue", revenue: 9200 }, { day: "Wed", revenue: 7800 },
  { day: "Thu", revenue: 10100 }, { day: "Fri", revenue: 13400 }, { day: "Sat", revenue: 15200 },
  { day: "Sun", revenue: 11800 },
];

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--terracotta))", "hsl(var(--warning))"];

const AI_INSIGHTS = [
  "Coffee demand is expected to rise between 5 PM and 7 PM. Pre-brew at 4:45 PM.",
  "Milk may run low by 7:30 PM. Restock 2 L before evening rush.",
  "Sandwich stock is high but sales are low. Promote Coffee + Sandwich combo.",
  "Hot Kitchen is approaching overload. Burger and Pizza may face 5 min delay.",
];

export default function AdminDashboard() {
  const { products: rawProducts, orders, ingredients: rawIngredients, tables: rawTables, customer } = useStore();

  const products = dedupeProducts(rawProducts);
  const ingredients = dedupeByKey(rawIngredients, i => `${i.cafe_id || "demo"}|${i.name}`);
  const tables = dedupeByKey(rawTables, t => `${t.cafe_id || "demo"}|${t.floor_id}|${t.table_number}`);

  const todayRevenue = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total_amount, 0) + 12480;
  const totalOrders = orders.filter(o => o.payment_status === "paid").length + 47;
  const activeTables = tables.filter(t => t.status !== "available" && t.status !== "paid").length;
  const pendingKitchen = orders.filter(o => o.kitchen_status !== "completed" && o.order_status === "sent_to_kitchen").length;
  const lowStock = ingredients.filter(i => i.current_stock < i.min_stock_level * 2).length;
  const topProduct = [...products].sort((a, b) => b.sold_today - a.sold_today)[0];

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => map.set(p.category_id, (map.get(p.category_id) || 0) + p.sold_today * p.price));
    return Array.from(map.entries()).map(([id, v]) => ({ name: id, value: v }));
  }, [products]);

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-3xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Live business intelligence for {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/pos"><div className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-soft hover:opacity-90">Open POS</div></Link>
            <Link to="/kds"><div className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-secondary">Kitchen Display</div></Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <KpiCard icon={IndianRupee} label="Today Revenue" value={formatINR(todayRevenue)} delta="+18%" color="primary" />
          <KpiCard icon={ShoppingBag} label="Orders" value={totalOrders.toString()} delta="+12" color="accent" />
          <KpiCard icon={TrendingUp} label="Avg Order" value={formatINR(todayRevenue / Math.max(1, totalOrders))} delta="+6%" color="terracotta" />
          <KpiCard icon={Grid3x3} label="Active Tables" value={`${activeTables}/12`} delta={`${tables.length - activeTables} free`} color="accent" />
          <KpiCard icon={ChefHat} label="Pending Kitchen" value={pendingKitchen.toString()} delta="2 high prio" color="warning" />
          <KpiCard icon={AlertTriangle} label="Low Stock" value={lowStock.toString()} delta="items" color="terracotta" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Sales trend */}
          <Card className="p-5 lg:col-span-2 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold">Sales Trend</div>
                <div className="text-xs text-muted-foreground">Last 7 days</div>
              </div>
              <Badge variant="outline" className="text-xs">+22% vs last week</Badge>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={SALES_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Shortcuts */}
          <Card className="p-5 shadow-soft border-primary/20 bg-gradient-to-br from-secondary/40 to-card flex flex-col justify-center">
            <div className="font-semibold text-sm mb-3">Quick Actions</div>
            <div className="space-y-2">
              <Link to="/admin/ai" className="block p-3 rounded-lg bg-card hover:bg-accent/10 transition-colors border border-border flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-terracotta" /> Ask AI Assistant
              </Link>
              <Link to="/admin/map" className="block p-3 rounded-lg bg-card hover:bg-accent/10 transition-colors border border-border flex items-center gap-2 text-sm">
                <MapIcon className="w-4 h-4 text-primary" /> View Map Intelligence
              </Link>
              <Link to="/admin/predictions" className="block p-3 rounded-lg bg-card hover:bg-accent/10 transition-colors border border-border flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-warning" /> View Demand Predictions
              </Link>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Orders by hour */}
          <Card className="p-5 shadow-soft">
            <div className="font-semibold mb-1">Orders by Hour</div>
            <div className="text-xs text-muted-foreground mb-3">Peak: 7 PM</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={HOUR_DATA}>
                <XAxis dataKey="hour" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Category split */}
          <Card className="p-5 shadow-soft">
            <div className="font-semibold mb-1">Category Sales</div>
            <div className="text-xs text-muted-foreground mb-3">Today</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Top products */}
          <Card className="p-5 shadow-soft">
            <div className="font-semibold mb-3 flex items-center justify-between">
              <span>Top Products</span>
              <Award className="w-4 h-4 text-terracotta" />
            </div>
            <div className="space-y-2">
              {[...products].sort((a, b) => b.sold_today - a.sold_today).slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 text-sm">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-terracotta text-white" : "bg-secondary"}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.sold_today} sold</div>
                  </div>
                  <div className="font-serif text-sm">{formatINR(p.sold_today * p.price)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Inventory preview */}
        <div className="grid lg:grid-cols-1 gap-6">
          <Card className="p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold flex items-center gap-2"><Package className="w-4 h-4" /> Ingredient Stock Alerts</div>
              <Link to="/admin/ingredients" className="text-xs text-primary hover:underline">View all →</Link>
            </div>
            <div className="space-y-2">
              {ingredients.filter(i => i.current_stock < i.min_stock_level * 2.5).slice(0, 5).map(i => {
                const ratio = i.current_stock / (i.min_stock_level * 2.5);
                return (
                  <div key={i.id} className="flex items-center gap-3 text-sm">
                    <AlertTriangle className={`w-4 h-4 ${ratio < 0.5 ? "text-destructive" : "text-warning"}`} />
                    <div className="flex-1">
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{i.current_stock} {i.unit} · min {i.min_stock_level}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{i.supplier_name}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function KpiCard({ icon: Icon, label, value, delta, color }: { icon: any; label: string; value: string; delta: string; color: string }) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    terracotta: "bg-terracotta/15 text-terracotta",
    warning: "bg-warning/20 text-warning",
  };
  return (
    <Card className="p-4 shadow-soft hover:shadow-elevated transition-shadow">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-serif text-xl leading-tight mt-0.5">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{delta}</div>
    </Card>
  );
}
