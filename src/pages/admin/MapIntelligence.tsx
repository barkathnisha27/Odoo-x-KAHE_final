import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Truck, Users, Sparkles, Building2, MapPin } from "lucide-react";

const HOTSPOTS = [
  { name: "Karpagam College", orders: 42, lvl: "high", x: 28, y: 35 },
  { name: "Gandhipuram", orders: 35, lvl: "high", x: 52, y: 48 },
  { name: "Peelamedu", orders: 22, lvl: "medium", x: 70, y: 30 },
  { name: "RS Puram", orders: 14, lvl: "low", x: 40, y: 65 },
  { name: "Saibaba Colony", orders: 8, lvl: "low", x: 22, y: 70 },
];
const SUPPLIERS = [
  { name: "Aavin Dairy", item: "Milk", distance: 2.4, eta: 18, x: 60, y: 20 },
  { name: "Bakery Hub", item: "Buns / Pizza Base", distance: 3.1, eta: 22, x: 35, y: 80 },
  { name: "FreshVeg", item: "Produce", distance: 4.5, eta: 28, x: 15, y: 50 },
];
const BRANCHES = [
  { name: "DineFlow Main", x: 45, y: 45, status: "active" },
  { name: "DineFlow Express", x: 62, y: 60, status: "planned" },
];

export default function MapIntelligence() {
  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        <PageHeader icon={MapIcon} title="Map Intelligence" description="Live deliveries, demand heatmap, suppliers & branch planning" />

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-0 shadow-soft overflow-hidden">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-accent/10 via-secondary/30 to-primary/5 overflow-hidden">
              {/* Decorative grid */}
              <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              {/* Heatmap circles */}
              {HOTSPOTS.map(h => (
                <div key={h.name} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse-ring"
                  style={{
                    left: `${h.x}%`, top: `${h.y}%`,
                    width: h.lvl === "high" ? 90 : h.lvl === "medium" ? 60 : 40,
                    height: h.lvl === "high" ? 90 : h.lvl === "medium" ? 60 : 40,
                    background: h.lvl === "high" ? "hsl(var(--terracotta) / 0.35)" : h.lvl === "medium" ? "hsl(var(--warning) / 0.3)" : "hsl(var(--accent) / 0.25)",
                  }}
                />
              ))}
              {HOTSPOTS.map(h => (
                <div key={h.name + "lbl"} className="absolute -translate-x-1/2 -translate-y-1/2 text-[10px] font-semibold flex items-center gap-1" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
                  <MapPin className="w-3 h-3 text-terracotta" />
                  <span className="bg-card/80 px-1.5 py-0.5 rounded">{h.name} · {h.orders}</span>
                </div>
              ))}
              {/* Suppliers */}
              {SUPPLIERS.map(s => (
                <div key={s.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
                  <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shadow-elevated"><Truck className="w-3.5 h-3.5" /></div>
                  <div className="text-[10px] font-medium bg-card/80 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">{s.name}</div>
                </div>
              ))}
              {/* Branches */}
              {BRANCHES.map(b => (
                <div key={b.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-warm ${b.status === "active" ? "gradient-warm" : "bg-muted border-2 border-dashed border-primary"}`}>
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-[10px] font-semibold bg-card px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">{b.name}</div>
                </div>
              ))}
            </div>
            <div className="p-4 flex items-center gap-4 text-xs flex-wrap border-t border-border">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-terracotta/50"/> High demand</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-warning/50"/> Medium demand</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-accent/50"/> Low demand</div>
              <div className="flex items-center gap-1.5"><Truck className="w-3 h-3 text-accent"/> Supplier</div>
              <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-primary"/> Branch</div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-5 shadow-soft">
              <div className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Demand Hotspots</div>
              <div className="space-y-2">
                {HOTSPOTS.map(h => (
                  <div key={h.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-terracotta" /> {h.name}</span>
                    <Badge variant={h.lvl === "high" ? "default" : "outline"} className="text-xs">{h.orders}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 shadow-soft">
              <div className="font-semibold mb-3 flex items-center gap-2"><Truck className="w-4 h-4" /> Nearby Suppliers</div>
              <div className="space-y-2">
                {SUPPLIERS.map(s => (
                  <div key={s.name} className="p-2 rounded-lg bg-secondary/40">
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.item} · {s.distance} km · {s.eta} min ETA</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 shadow-soft bg-gradient-to-br from-secondary/40 to-card border-primary/20">
              <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-terracotta" /><div className="font-semibold text-sm">AI Branch Suggestion</div></div>
              <p className="text-xs text-muted-foreground">Open a 2nd branch near <b className="text-foreground">Karpagam College</b> — ~42 orders/day untapped. Forecast payback: 14 months.</p>
              <Button size="sm" variant="outline" className="w-full mt-3">View full report</Button>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
