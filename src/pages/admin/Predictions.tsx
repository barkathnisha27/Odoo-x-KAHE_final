import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, AlertTriangle, Truck, Trash2, Clock, Download } from "lucide-react";
import { useStore, formatINR } from "@/lib/store";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, AreaChart, Area } from "recharts";
import { exportToPDF, exportToXLSX } from "@/lib/exporters";
import { toast } from "sonner";

const DEMAND_FORECAST = [
  { hour: "10am", actual: 4, predicted: 5 },
  { hour: "11am", actual: 6, predicted: 7 },
  { hour: "12pm", actual: 12, predicted: 13 },
  { hour: "1pm", actual: 18, predicted: 17 },
  { hour: "2pm", actual: 14, predicted: 15 },
  { hour: "3pm", actual: 8, predicted: 10 },
  { hour: "4pm", actual: 10, predicted: 12 },
  { hour: "5pm", actual: null as any, predicted: 18 },
  { hour: "6pm", actual: null as any, predicted: 24 },
  { hour: "7pm", actual: null as any, predicted: 28 },
  { hour: "8pm", actual: null as any, predicted: 22 },
  { hour: "9pm", actual: null as any, predicted: 14 },
];

const DELAY_RISK = [
  { item: "Burger", risk: 78 }, { item: "Pizza", risk: 72 }, { item: "Pasta", risk: 55 },
  { item: "Sandwich", risk: 32 }, { item: "Coffee", risk: 18 }, { item: "Tea", risk: 12 },
];

const WASTE = [
  { day: "Mon", waste: 320 }, { day: "Tue", waste: 280 }, { day: "Wed", waste: 410 },
  { day: "Thu", waste: 240 }, { day: "Fri", waste: 180 }, { day: "Sat", waste: 150 }, { day: "Sun", waste: 200 },
];

export default function Predictions() {
  const { ingredients, products } = useStore();
  const lowStock = ingredients.filter(i => i.current_stock < i.min_stock_level * 2);

  const restockSuggestions = lowStock.slice(0, 6).map(i => ({
    name: i.name, current: `${i.current_stock} ${i.unit}`, suggested: `${i.min_stock_level * 4} ${i.unit}`,
    supplier: i.supplier_name, eta: `${Math.floor(Math.random() * 30) + 10} min`,
    cost: formatINR((i.min_stock_level * 4 - i.current_stock) * i.cost_per_unit),
  }));

  const handleExport = (type: "pdf" | "xlsx") => {
    try {
      if (type === "xlsx") {
        exportToXLSX("dineflow-predictions", [
          { name: "Demand", rows: DEMAND_FORECAST },
          { name: "Delay Risk", rows: DELAY_RISK },
          { name: "Restock", rows: restockSuggestions },
        ]);
      } else {
        exportToPDF("dineflow-predictions", "Predictive Insights Report", [
          { heading: "Hourly Demand Forecast", columns: ["Hour", "Actual", "Predicted"], rows: DEMAND_FORECAST.map(r => [r.hour, r.actual ?? "—", r.predicted]) },
          { heading: "Delay Risk", columns: ["Item", "Risk %"], rows: DELAY_RISK.map(r => [r.item, r.risk]) },
          { heading: "Restock Suggestions", columns: ["Ingredient", "Current", "Suggested", "Supplier", "ETA", "Cost"], rows: restockSuggestions.map(r => [r.name, r.current, r.suggested, r.supplier, r.eta, r.cost]) },
        ]);
      }
      toast.success("Report downloaded successfully.");
    } catch (e) {
      toast.error("Failed to download report. Please try again.");
    }
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        <PageHeader icon={Sparkles} title="Predictive Insights" description="AI-powered demand, delay, waste & restock forecasts"
          actions={<>
            <Button variant="outline" onClick={() => handleExport("pdf")}><Download className="w-4 h-4 mr-1.5" /> PDF</Button>
            <Button variant="outline" onClick={() => handleExport("xlsx")}><Download className="w-4 h-4 mr-1.5" /> Excel</Button>
          </>}
        />

        <div className="grid md:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 shadow-soft"><div className="text-xs text-muted-foreground">Peak Hour Today</div><div className="font-serif text-2xl">7 PM</div><div className="text-xs text-accent">28 orders predicted</div></Card>
          <Card className="p-4 shadow-soft"><div className="text-xs text-muted-foreground">Delay Risk</div><div className="font-serif text-2xl text-warning">Medium</div><div className="text-xs text-muted-foreground">3 items at risk</div></Card>
          <Card className="p-4 shadow-soft"><div className="text-xs text-muted-foreground">Waste Forecast</div><div className="font-serif text-2xl">{formatINR(180)}</div><div className="text-xs text-success">-32% vs last week</div></Card>
          <Card className="p-4 shadow-soft"><div className="text-xs text-muted-foreground">Restock Items</div><div className="font-serif text-2xl">{lowStock.length}</div><div className="text-xs text-terracotta">action recommended</div></Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-5 shadow-soft lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div><div className="font-semibold">Hourly Demand Forecast</div><div className="text-xs text-muted-foreground">Solid = actual · Dashed = AI prediction</div></div>
              <Badge variant="outline" className="text-xs"><Sparkles className="w-3 h-3 mr-1" /> 94% accuracy</Badge>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={DEMAND_FORECAST}>
                <defs>
                  <linearGradient id="pred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="predicted" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" fill="url(#pred)" />
                <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 shadow-soft">
            <div className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Delay Risk by Item</div>
            <div className="space-y-3">
              {DELAY_RISK.map(d => (
                <div key={d.item}>
                  <div className="flex justify-between text-sm mb-1"><span>{d.item}</span><span className={d.risk > 60 ? "text-destructive font-semibold" : d.risk > 40 ? "text-warning" : "text-muted-foreground"}>{d.risk}%</span></div>
                  <Progress value={d.risk} className="h-1.5" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Supplier Restock Suggestions</div>
              <Badge className="bg-accent text-accent-foreground">AI-ranked</Badge>
            </div>
            <div className="space-y-2">
              {restockSuggestions.map(r => (
                <div key={r.name} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.current} → order {r.suggested} · {r.supplier} · ETA {r.eta}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{r.cost}</div>
                    <Button size="sm" variant="outline" className="h-6 text-xs mt-1">Order</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 shadow-soft">
            <div className="font-semibold mb-3 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Waste Forecast (g)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={WASTE}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="waste" fill="hsl(var(--terracotta))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-muted-foreground mt-2"><Sparkles className="w-3 h-3 inline mr-1 text-terracotta" /> AI suggests reducing Sandwich prep by 15% on Wed to cut waste.</div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
