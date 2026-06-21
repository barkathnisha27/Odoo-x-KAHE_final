import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, ChefHat, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DemoBadge } from "@/components/DemoBadge";

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

function readKitchenOrdersFromLocalStorage() {
  const kitchenOrders = readJSON(KITCHEN_ORDERS_KEY, []);
  const activeOrder = readJSON(ACTIVE_CUSTOMER_ORDER_KEY, null);

  const all = [
    ...(Array.isArray(kitchenOrders) ? kitchenOrders : []),
    ...(activeOrder ? [activeOrder] : []),
  ];

  return all;
}

function normalizeOrder(order: any) {
  const id = order?.id || order?.order_number || `ORD-${Date.now()}`;
  const items = Array.isArray(order?.items) ? order.items : [];

  return {
    ...order,
    id,
    order_number: order?.order_number || id,
    customer_name:
      order?.customer_name ||
      order?.customerName ||
      order?.customer?.name ||
      "Customer",
    table_number:
      order?.table_number ||
      order?.tableNumber ||
      order?.table?.number ||
      "N/A",
    order_source: order?.order_source || order?.source || "customer",
    status: order?.status || order?.order_status || order?.kitchen_status || "to_cook",
    order_status: order?.order_status || order?.status || "to_cook",
    kitchen_status: order?.kitchen_status || order?.order_status || order?.status || "to_cook",
    customer_status: order?.customer_status || "sent_to_kitchen",
    items: items.map((item: any, index: number) => {
      const qty = Number(item.quantity || item.qty || 1);
      const price = Number(item.unit_price || item.price || 0);
      const name =
        item.product_name ||
        item.name ||
        item.title ||
        `Item ${index + 1}`;

      return {
        ...item,
        id: item.id || item.product_id || `ITEM-${id}-${index}`,
        product_name: name,
        name,
        quantity: qty,
        unit_price: price,
        price,
        subtotal: Number(item.subtotal || qty * price),
        status: item.status || "to_cook",
        kitchen_status: item.kitchen_status || "to_cook",
        completed: Boolean(item.completed),
      };
    }),
  };
}

function dedupeOrders(orders: any[]) {
  const seen = new Set();

  return orders.filter((order) => {
    if (!order) return false;
    const id = order.id || order.order_number;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function waitingMinutes(o: any) {
  return Math.max(0, Math.floor((Date.now() - new Date(o.created_at || Date.now()).getTime()) / 60000));
}

function updateOrderStatus(orderId: string, status: "to_cook" | "preparing" | "completed") {
  const existing = readJSON(KITCHEN_ORDERS_KEY, []);
  const updated = existing.map((order: any) => {
    const id = order.id || order.order_number;
    if (id !== orderId) return order;

    const customerStatus =
      status === "to_cook"
        ? "sent_to_kitchen"
        : status === "preparing"
        ? "preparing"
        : "ready_to_serve";

    return {
      ...order,
      status,
      order_status: status,
      kitchen_status: status,
      customer_status: customerStatus,
      updated_at: new Date().toISOString(),
      items: Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            ...item,
            status,
            kitchen_status: status,
            completed: status === "completed" ? true : item.completed || false,
          }))
        : [],
    };
  });

  localStorage.setItem(KITCHEN_ORDERS_KEY, JSON.stringify(updated));

  const active = readJSON(ACTIVE_CUSTOMER_ORDER_KEY, null);
  if (active && (active.id || active.order_number) === orderId) {
    const updatedActive = updated.find((o: any) => (o.id || o.order_number) === orderId);
    if (updatedActive) {
      localStorage.setItem(ACTIVE_CUSTOMER_ORDER_KEY, JSON.stringify(updatedActive));
    }
  }

  window.dispatchEvent(new Event("dineflow-orders-updated"));
}

function createEmergencyKitchenOrder() {
  const order = normalizeOrder({
    id: `ORD-${Date.now()}`,
    order_number: `ORD-${Date.now()}`,
    cafe_id: "demo-cafe",
    customer_name: "Demo Customer",
    table_number: "Table 1",
    order_source: "customer",
    items: [
      {
        id: "coffee-demo",
        product_name: "Coffee",
        name: "Coffee",
        quantity: 2,
        price: 80,
        unit_price: 80,
        subtotal: 160,
      },
      {
        id: "burger-demo",
        product_name: "Burger",
        name: "Burger",
        quantity: 1,
        price: 150,
        unit_price: 150,
        subtotal: 150,
      },
    ],
    subtotal: 310,
    discount_amount: 0,
    tax_amount: 15.5,
    total_amount: 325.5,
    status: "to_cook",
    order_status: "to_cook",
    kitchen_status: "to_cook",
    customer_status: "sent_to_kitchen",
    payment_status: "pending",
    created_at: new Date().toISOString(),
  });

  const existing = readJSON(KITCHEN_ORDERS_KEY, []);
  const updated = dedupeOrders([order, ...existing]);
  localStorage.setItem(KITCHEN_ORDERS_KEY, JSON.stringify(updated));
  localStorage.setItem(ACTIVE_CUSTOMER_ORDER_KEY, JSON.stringify(order));
  window.dispatchEvent(new Event("dineflow-orders-updated"));
}

const normalizeStatus = (order: any) => {
  const status =
    order?.kitchen_status ||
    order?.order_status ||
    order?.status ||
    "to_cook";

  if (status === "sent_to_kitchen" || status === "pending") return "to_cook";
  if (status === "ready_to_serve" || status === "ready" || status === "paid") return "completed";

  return status;
};

export default function KDS() {
  const { orders } = useStore();
  const { cafeId } = useAuth();
  const [search, setSearch] = useState("");
  const [station, setStation] = useState<string>("all");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshTick((x) => x + 1);

    window.addEventListener("dineflow-orders-updated", refresh);
    window.addEventListener("storage", refresh);

    const interval = setInterval(refresh, 1000);

    return () => {
      window.removeEventListener("dineflow-orders-updated", refresh);
      window.removeEventListener("storage", refresh);
      clearInterval(interval);
    };
  }, []);

  const allOrders = useMemo(() => {
    const tick = refreshTick;
    const storeOrders = Array.isArray(orders) ? orders : [];
    const storeKitchenOrders = Array.isArray((orders as any).kitchenOrders) ? (orders as any).kitchenOrders : [];
    const localOrders = readKitchenOrdersFromLocalStorage();

    return dedupeOrders(
      [...storeOrders, ...storeKitchenOrders, ...localOrders].map(normalizeOrder)
    );
  }, [orders, refreshTick]);

  const visibleOrders = useMemo(() => {
    return allOrders.filter((order) => {
      // safe cafe match - if either is missing, allow it through for demo safety
      if (cafeId && order.cafe_id && cafeId !== order.cafe_id) {
        return false;
      }
      return ["to_cook", "preparing", "completed"].includes(normalizeStatus(order));
    });
  }, [allOrders, cafeId]);

  const stations = Array.from(new Set(
    visibleOrders.flatMap(o => o.items?.map((i: any) => i.station).filter(Boolean) ?? [])
  ));

  const filtered = visibleOrders.filter(o =>
    (search === "" ||
      (o.id ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.order_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.items ?? []).some((i: any) => (i.product_name ?? "").toLowerCase().includes(search.toLowerCase()))) &&
    (station === "all" || (o.items ?? []).some((i: any) => i.station === station))
  );

  const toCookOrders = filtered.filter((order) => normalizeStatus(order) === "to_cook");
  const preparingOrders = filtered.filter((order) => normalizeStatus(order) === "preparing");
  const completedOrders = filtered.filter((order) => normalizeStatus(order) === "completed");

  const cols: { title: string; key: "to_cook" | "preparing" | "completed"; orders: any[]; tone: string }[] = [
    { title: "To Cook", key: "to_cook", tone: "border-destructive/60 bg-destructive/5", orders: toCookOrders },
    { title: "Preparing", key: "preparing", tone: "border-warning/60 bg-warning/5", orders: preparingOrders },
    { title: "Completed", key: "completed", tone: "border-success/40 bg-success/5", orders: completedOrders },
  ];

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-4 lg:p-6 h-screen flex flex-col">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl flex items-center gap-2"><ChefHat className="w-6 h-6" /> Kitchen Display</h1>
            <p className="text-sm text-muted-foreground">{visibleOrders.filter(o => normalizeStatus(o) !== "completed").length} active tickets</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search order / item" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
            </div>
            <select value={station} onChange={e => setStation(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
              <option value="all">All stations</option>
              {stations.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
            </select>
          </div>
        </div>

        {visibleOrders.length === 0 && (
          <Card className="flex-1 flex items-center justify-center border-dashed flex-col gap-4">
            <div className="text-center text-muted-foreground">
              <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <div className="font-serif text-xl">No kitchen orders yet.</div>
              <div className="text-sm mt-1">Place an order from POS and click Send to Kitchen.</div>
            </div>
            <Button onClick={createEmergencyKitchenOrder} variant="secondary">
              <Sparkles className="w-4 h-4 mr-2 text-terracotta" />
              Create Demo Kitchen Order
            </Button>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-3 flex-1 overflow-hidden">
          {cols.map(col => (
            <div key={col.key} className={`flex flex-col rounded-xl border-2 ${col.tone} overflow-hidden`}>
              <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between bg-card/50">
                <span className="font-semibold text-sm">{col.title}</span>
                <Badge variant="secondary" className="h-5">{col.orders.length}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                {col.orders.map(order => {
                  const waiting = waitingMinutes(order);
                  const delay = waiting > (order.eta_minutes || 0) ? "delayed" : waiting > (order.eta_minutes || 0) - 2 ? "at_risk" : "on_time";
                  
                  return (
                    <Card key={order.id} className="p-3 shadow-soft animate-slide-up bg-card flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong>Order #{order.order_number}</strong>
                          <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                            <p>Customer: {order.customer_name}</p>
                            <p>Table: {order.table_number}</p>
                            <p>Source: {order.order_source}</p>
                          </div>
                        </div>
                        <Badge variant={delay === "delayed" ? "destructive" : delay === "at_risk" ? "secondary" : "outline"} className="text-[9px] h-4 px-1.5">
                          {delay === "delayed" ? "Delayed" : delay === "at_risk" ? "At risk" : "On time"}
                        </Badge>
                      </div>

                      <div className="space-y-1 mb-2 bg-secondary/20 p-2 rounded">
                        {(Array.isArray(order.items) ? order.items : []).map((item: any) => (
                          <div key={item.id} className="text-xs">
                            <strong>{item.quantity || 1} ×</strong> {item.product_name || item.name || "Unnamed Item"}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2 pt-2 border-t border-border/50">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {waiting}m waited</span>
                        <span className="capitalize font-medium">{order.priority_level || "normal"}</span>
                      </div>

                      {normalizeStatus(order) !== "completed" && waiting >= 8 && (
                        <div className="text-[10px] flex gap-1 p-1.5 rounded bg-terracotta/10 text-terracotta mb-2">
                          <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                          Prepare first — high wait.
                        </div>
                      )}

                      {normalizeStatus(order) === "to_cook" && (
                        <Button size="sm" className="w-full h-7 text-xs" onClick={() => updateOrderStatus(order.id || order.order_number, "preparing")}>
                          Start Preparing
                        </Button>
                      )}
                      
                      {normalizeStatus(order) === "preparing" && (
                        <Button size="sm" className="w-full h-7 text-xs variant-default bg-warning hover:bg-warning/90 text-warning-foreground" onClick={() => updateOrderStatus(order.id || order.order_number, "completed")}>
                          Mark Completed
                        </Button>
                      )}

                      {normalizeStatus(order) === "completed" && (
                        <div className="flex items-center gap-1 text-success text-xs justify-center font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                        </div>
                      )}
                    </Card>
                  );
                })}
                {col.orders.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-8 opacity-60">—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
