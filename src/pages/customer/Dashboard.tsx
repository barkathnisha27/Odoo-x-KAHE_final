import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore, formatINR } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, ShoppingBag, Award, Heart, TrendingUp, IndianRupee, Tag,
  Clock, CheckCircle2, Coffee, Cookie, ChefHat, Utensils, ArrowRight, LogOut,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import CustomerAIAssistant from "@/components/CustomerAIAssistant";

const KITCHEN_ORDERS_KEY = "dineflow_kitchen_orders";
const ACTIVE_CUSTOMER_ORDER_KEY = "dineflow_active_customer_order";

function readJSON(key: string, fallback: any) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getLatestActiveCustomerOrder(currentUser?: any) {
  const active = readJSON(ACTIVE_CUSTOMER_ORDER_KEY, null);
  const kitchenOrders = readJSON(KITCHEN_ORDERS_KEY, []);

  if (active) {
    const activeId = active.id || active.order_number;
    const fresh = Array.isArray(kitchenOrders)
      ? kitchenOrders.find((o: any) => (o.id || o.order_number) === activeId)
      : null;

    return fresh || active;
  }

  if (Array.isArray(kitchenOrders) && currentUser) {
    return kitchenOrders.find((o: any) =>
      o.customer_id === currentUser.id ||
      o.customer_email === currentUser.email ||
      o.customer_name === currentUser.name
    ) || null;
  }

  return null;
}

function getRawOrderStatus(order: any) {
  return (
    order?.customer_status ||
    order?.kitchen_status ||
    order?.order_status ||
    order?.status ||
    "order_placed"
  );
}

function normalizeCustomerStatus(order: any) {
  const status = getRawOrderStatus(order);

  if (status === "to_cook" || status === "sent_to_kitchen" || status === "pending") {
    return "sent_to_kitchen";
  }

  if (status === "preparing") {
    return "preparing";
  }

  if (status === "completed" || status === "ready_to_serve" || status === "ready" || status === "paid") {
    return "ready_to_serve";
  }

  return "order_placed";
}

function getCustomerStatusLabel(order: any) {
  if (!order) return "No active order";
  const status = normalizeCustomerStatus(order);

  if (status === "sent_to_kitchen") return "Sent to Kitchen";
  if (status === "preparing") return "Preparing";
  if (status === "ready_to_serve") return "Ready to Serve";

  return "Order Placed";
}

const trackingSteps = [
  { key: "order_placed", label: "Order Placed", icon: ShoppingBag },
  { key: "sent_to_kitchen", label: "Sent to Kitchen", icon: ChefHat },
  { key: "preparing", label: "Preparing", icon: Utensils },
  { key: "ready_to_serve", label: "Ready to Serve", icon: CheckCircle2 },
];

function getTrackingStepIndex(order: any) {
  if (!order) return -1;
  const status = normalizeCustomerStatus(order);

  if (status === "order_placed") return 0;
  if (status === "sent_to_kitchen") return 1;
  if (status === "preparing") return 2;
  if (status === "ready_to_serve") return 3;

  return 0;
}

export default function CustomerDashboard() {
  const { customer, products } = useStore();
  const { signOut, role, user: currentUser } = useAuth();
  const isGuest = role === "guest";
  const nav = useNavigate();

  const [activeOrder, setActiveOrder] = useState<any>(null);

  useEffect(() => {
    const refreshActiveOrder = () => {
      setActiveOrder(getLatestActiveCustomerOrder(currentUser));
    };

    refreshActiveOrder();

    window.addEventListener("dineflow-orders-updated", refreshActiveOrder);
    window.addEventListener("storage", refreshActiveOrder);

    const interval = setInterval(refreshActiveOrder, 1000);

    return () => {
      window.removeEventListener("dineflow-orders-updated", refreshActiveOrder);
      window.removeEventListener("storage", refreshActiveOrder);
      clearInterval(interval);
    };
  }, [currentUser?.id, currentUser?.email, currentUser?.name]);

  const favProduct = products.find(p => p.id === customer.favorite_items[0]);
  const nextRewardAt = customer.loyalty_points >= 250 ? 500 : customer.loyalty_points >= 100 ? 250 : 100;
  const rewardProgress = (customer.loyalty_points / nextRewardAt) * 100;

  const currentStepIndex = getTrackingStepIndex(activeOrder);

  return (
    <div className="min-h-screen bg-background pb-12">
      <DemoBadge />
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Welcome back</div>
            <h1 className="font-serif text-2xl leading-tight">Hi {customer.name || currentUser?.name || 'Guest'} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-semibold">{customer.tier} · {customer.loyalty_points} pts</Badge>
            <Link to="/customer/menu"><Button size="sm"><ShoppingBag className="w-4 h-4 mr-1.5" /> Order</Button></Link>
            <Button size="sm" variant="outline" onClick={async () => { await signOut(); toast.success("Signed out"); nav("/"); }}>
              <LogOut className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Top stats */}
        {!isGuest && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Heart} label="Loyalty" value={`${customer.loyalty_points} pts`} sub={customer.tier} accent="terracotta" />
            <StatCard icon={ShoppingBag} label="Total Orders" value={customer.total_orders.toString()} sub="lifetime" accent="primary" />
            <StatCard icon={IndianRupee} label="Total Spent" value={formatINR(customer.total_spent)} sub="lifetime" accent="accent" />
            <StatCard icon={Tag} label="Offer" value="COFFEE10" sub="10% off" accent="warning" />
          </div>
        )}

        {/* Active order */}
        {activeOrder ? (
          <Card className="p-5 shadow-soft border-primary/20 bg-gradient-to-br from-secondary/30 to-card animate-slide-up">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Active Order</div>
                  <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    {getCustomerStatusLabel(activeOrder)}
                  </Badge>
                </div>
                <div className="font-serif text-xl mt-0.5">{activeOrder.order_number}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {activeOrder.items?.length || 0} items · {formatINR(activeOrder.total_amount || 0)}
                  {activeOrder.eta_minutes > 0 && <> · ETA <b className="text-foreground">{activeOrder.eta_minutes} min</b></>}
                </div>
                {normalizeCustomerStatus(activeOrder) === "ready_to_serve" && (
                  <div className="mt-2 text-sm font-semibold text-terracotta">
                    Ready to Serve — Please collect your order.
                  </div>
                )}
              </div>
              {activeOrder.payment_status === "unpaid" && normalizeCustomerStatus(activeOrder) === "ready_to_serve" && (
                <Link to={`/customer/orders`}><Button size="sm">Pay now <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {trackingSteps.map((s, i) => {
                const done = i <= currentStepIndex;
                const Icon = s.icon;
                return (
                  <div key={s.key} className="flex flex-col items-center gap-1 text-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${done ? "bg-accent text-accent-foreground shadow-soft animate-pulse-ring" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className={`text-[10px] font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center border-dashed">
            <Coffee className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <div className="font-serif text-lg">No active order</div>
            <div className="text-sm text-muted-foreground mb-3">Hungry? Browse the menu.</div>
            <Link to="/customer/menu"><Button size="sm">Open menu</Button></Link>
          </Card>
        )}

        {!isGuest && (
          <>
            <div className="grid lg:grid-cols-3 gap-6">
              <CustomerAIAssistant />

              {/* Rewards */}
              <Card className="p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-terracotta" />
                  <div className="font-semibold">Rewards</div>
                </div>
                <div className="text-3xl font-serif">{customer.loyalty_points}<span className="text-base text-muted-foreground"> pts</span></div>
                <div className="text-xs text-muted-foreground mt-1">{nextRewardAt - customer.loyalty_points} pts to next reward</div>
                <Progress value={rewardProgress} className="mt-3 h-2" />
                <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
                  <div className="p-2 rounded-lg bg-secondary"><div className="font-semibold">100</div><div className="text-muted-foreground">₹20 off</div></div>
                  <div className="p-2 rounded-lg bg-secondary"><div className="font-semibold">250</div><div className="text-muted-foreground">₹50 off</div></div>
                  <div className="p-2 rounded-lg bg-secondary"><div className="font-semibold">500</div><div className="text-muted-foreground">Gold</div></div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">Redeem points</Button>
              </Card>
            </div>

            {/* Favorites */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-xl">Your favorites</h2>
                <Link to="/customer/menu" className="text-sm text-primary hover:underline">See menu →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {customer.favorite_items.map(pid => {
                  const p = products.find(x => x.id === pid);
                  if (!p) return null;
                  return (
                    <Card key={pid} className="p-4 hover:shadow-elevated transition-shadow cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-2">
                        <Cookie className="w-6 h-6 text-primary" />
                      </div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{formatINR(p.price)} · {p.prep_time_minutes} min</div>
                      <Link to="/customer/menu"><Button variant="outline" size="sm" className="w-full mt-2">Reorder</Button></Link>
                    </Card>
                  );
                })}
                {favProduct === undefined && <div className="text-sm text-muted-foreground col-span-full">Order something to build favorites.</div>}
              </div>
            </div>

            {/* Spending insights */}
            <div className="grid md:grid-cols-3 gap-3">
              <Card className="p-4 shadow-soft">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="w-4 h-4" /> Average bill</div>
                <div className="font-serif text-2xl mt-1">{formatINR(customer.total_spent / Math.max(1, customer.total_orders))}</div>
              </Card>
              <Card className="p-4 shadow-soft">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Heart className="w-4 h-4" /> Top category</div>
                <div className="font-serif text-2xl mt-1">Beverages</div>
              </Card>
              <Card className="p-4 shadow-soft">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4" /> Best time</div>
                <div className="font-serif text-2xl mt-1">5 – 7 PM</div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string; sub: string; accent: string }) {
  const colors: Record<string, string> = {
    terracotta: "bg-terracotta/15 text-terracotta",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    warning: "bg-warning/15 text-warning",
  };
  return (
    <Card className="p-4 shadow-soft">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[accent]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-serif text-2xl leading-tight">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{sub}</div>
    </Card>
  );
}
