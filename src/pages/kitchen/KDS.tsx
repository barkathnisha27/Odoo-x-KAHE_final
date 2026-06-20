import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useStore, formatINR } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, ChefHat, Sparkles, AlertTriangle, CheckCircle2, Filter } from "lucide-react";
import { toast } from "sonner";
import { DemoBadge } from "@/components/DemoBadge";
import type { Order, KitchenStatus } from "@/lib/types";

function waitingMinutes(o: Order) {
  return Math.max(0, Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000));
}

export default function KDS() {
  const { orders, setKitchenStatus, markItemCompleted, getIngredientForProduct } = useStore();
  const [search, setSearch] = useState("");
  const [station, setStation] = useState<string>("all");

  const active = useMemo(
    () => orders.filter(o => o.order_status === "sent_to_kitchen" || o.order_status === "ready" || (o.order_status === "paid" && o.kitchen_status !== "completed")),
    [orders]
  );

  const stations = Array.from(new Set(orders.flatMap(o => o.items.map(i => i.station))));

  const filtered = active.filter(o =>
    (search === "" || o.order_number.toLowerCase().includes(search.toLowerCase()) || o.items.some(i => i.product_name.toLowerCase().includes(search.toLowerCase()))) &&
    (station === "all" || o.items.some(i => i.station === station))
  );

  const cols: { title: string; key: string; orders: Order[]; tone: string }[] = [
    { title: "High Priority", key: "high", tone: "border-destructive/60 bg-destructive/5", orders: filtered.filter(o => o.kitchen_status !== "completed" && (o.priority_level === "high" || waitingMinutes(o) >= 12)) },
    { title: "Medium Priority", key: "medium", tone: "border-warning/60 bg-warning/5", orders: filtered.filter(o => o.kitchen_status !== "completed" && o.priority_level === "medium" && waitingMinutes(o) < 12) },
    { title: "Normal", key: "normal", tone: "border-accent/40 bg-accent/5", orders: filtered.filter(o => o.kitchen_status !== "completed" && o.priority_level === "normal" && waitingMinutes(o) < 12) },
    { title: "Completed", key: "completed", tone: "border-success/40 bg-success/5", orders: filtered.filter(o => o.kitchen_status === "completed") },
  ];

  function advance(o: Order) {
    const next: KitchenStatus = o.kitchen_status === "to_cook" ? "preparing" : o.kitchen_status === "preparing" ? "completed" : "completed";
    setKitchenStatus(o.id, next);
    toast.success(`${o.order_number} → ${next.replace("_", " ")}`);
  }

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-4 lg:p-6 h-screen flex flex-col">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl flex items-center gap-2"><ChefHat className="w-6 h-6" /> Kitchen Display</h1>
            <p className="text-sm text-muted-foreground">{active.filter(o => o.kitchen_status !== "completed").length} active tickets</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search order / item" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
            </div>
            <select value={station} onChange={e => setStation(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
              <option value="all">All stations</option>
              {stations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {active.length === 0 && (
          <Card className="flex-1 flex items-center justify-center border-dashed">
            <div className="text-center text-muted-foreground">
              <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <div className="font-serif text-xl">All caught up.</div>
              <div className="text-sm">New orders will appear here in real time.</div>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-4 gap-3 flex-1 overflow-hidden">
          {cols.map(col => (
            <div key={col.key} className={`flex flex-col rounded-xl border-2 ${col.tone} overflow-hidden`}>
              <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between bg-card/50">
                <span className="font-semibold text-sm">{col.title}</span>
                <Badge variant="secondary" className="h-5">{col.orders.length}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                {col.orders.map(o => {
                  const waiting = waitingMinutes(o);
                  const delay = waiting > o.eta_minutes ? "delayed" : waiting > o.eta_minutes - 2 ? "at_risk" : "on_time";
                  return (
                    <Card key={o.id} className="p-3 shadow-soft animate-slide-up bg-card">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-serif text-base leading-none">{o.order_number}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {o.table_id ? `Table ${o.table_id.replace("t", "")}` : o.source}
                          </div>
                        </div>
                        <Badge variant={delay === "delayed" ? "destructive" : delay === "at_risk" ? "secondary" : "outline"} className="text-[9px] h-4 px-1.5">
                          {delay === "delayed" ? "Delayed" : delay === "at_risk" ? "At risk" : "On time"}
                        </Badge>
                      </div>

                      <div className="space-y-1 mb-2">
                        {o.items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => markItemCompleted(o.id, item.id)}
                            className={`w-full flex justify-between text-xs p-1.5 rounded hover:bg-secondary/50 ${item.item_status === "completed" ? "line-through text-muted-foreground" : ""}`}
                          >
                            <span><b>{item.quantity}×</b> {item.product_name}</span>
                            <span className="text-muted-foreground text-[10px]">{item.station.split(" ")[0]}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2 pt-2 border-t border-border/50">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {waiting}m waited · ETA {o.eta_minutes}m</span>
                        <span className="capitalize font-medium">{o.priority_level}</span>
                      </div>

                      {o.kitchen_status !== "completed" && waiting >= 8 && (
                        <div className="text-[10px] flex gap-1 p-1.5 rounded bg-terracotta/10 text-terracotta mb-2">
                          <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                          Prepare first — high wait + long-prep items.
                        </div>
                      )}

                      {o.kitchen_status !== "completed" ? (
                        <Button size="sm" className="w-full h-7 text-xs" onClick={() => advance(o)}>
                          {o.kitchen_status === "to_cook" ? "Start preparing" : "Mark completed"}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 text-success text-xs justify-center">
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
