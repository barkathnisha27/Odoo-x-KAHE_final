import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Play, TrendingUp, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { useStore, formatINR } from "@/lib/store";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type ScenarioKey = "rush" | "shortage" | "delay" | "combo";

const SCENARIOS: { key: ScenarioKey; title: string; desc: string }[] = [
  { key: "rush", title: "Rush Hour Surge", desc: "Simulate 3× order volume between 6–8 PM" },
  { key: "shortage", title: "Ingredient Shortage", desc: "Simulate running out of Milk by 5 PM" },
  { key: "delay", title: "Kitchen Slowdown", desc: "Simulate +40% prep time across Hot Kitchen" },
  { key: "combo", title: "Combo Promo Launch", desc: "Simulate launching Coffee+Brownie combo at 10% off" },
];

export default function Simulation() {
  const { products } = useStore();
  const [scenario, setScenario] = useState<ScenarioKey>("rush");
  const [intensity, setIntensity] = useState([60]);
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const baseRevenue = 12480;
      const i = intensity[0] / 50;
      let revenue = baseRevenue, delay = 8, waste = 320, satisfaction = 88, insight = "";
      let chart = Array.from({ length: 12 }, (_, h) => ({ hour: `${h + 10}h`, baseline: 6 + Math.round(Math.sin(h / 3) * 4 + 6), scenario: 0 }));
      if (scenario === "rush") {
        revenue = Math.round(baseRevenue * (1 + 0.55 * i)); delay = Math.round(8 + 9 * i); waste = Math.round(320 - 60 * i); satisfaction = Math.round(88 - 14 * i);
        chart = chart.map((c, h) => ({ ...c, scenario: c.baseline * (h >= 6 && h <= 8 ? 1 + 1.6 * i : 1) }));
        insight = `+${Math.round(55 * i)}% revenue, but kitchen delay rises to ${delay} min — pre-brew Coffee at 4:45 PM and stage 2 extra staff at Hot Kitchen.`;
      } else if (scenario === "shortage") {
        revenue = Math.round(baseRevenue * (1 - 0.18 * i)); delay = Math.round(8 + 3 * i); waste = Math.round(320 + 80 * i); satisfaction = Math.round(88 - 22 * i);
        chart = chart.map((c, h) => ({ ...c, scenario: h >= 7 ? Math.round(c.baseline * (1 - 0.5 * i)) : c.baseline }));
        insight = `Milk runs out at 5 PM — 7 menu items become unavailable. AI suggests offering Black Coffee promo or emergency 1L Milk pickup from Aavin (2.4 km).`;
      } else if (scenario === "delay") {
        revenue = Math.round(baseRevenue * (1 - 0.10 * i)); delay = Math.round(8 + 12 * i); waste = 320; satisfaction = Math.round(88 - 20 * i);
        chart = chart.map(c => ({ ...c, scenario: Math.round(c.baseline * (1 - 0.18 * i)) }));
        insight = `Avg delay ${delay} min — customer satisfaction drops ${20 * i}%. Reorder kitchen queue by priority and shift simple items (Tea/Samosa) to a dedicated station.`;
      } else if (scenario === "combo") {
        revenue = Math.round(baseRevenue * (1 + 0.22 * i)); delay = 9; waste = Math.round(320 - 30 * i); satisfaction = Math.round(88 + 6 * i);
        chart = chart.map(c => ({ ...c, scenario: Math.round(c.baseline * (1 + 0.3 * i)) }));
        insight = `Combo lifts revenue +${Math.round(22 * i)}% and customer satisfaction +${Math.round(6 * i)}%. Highest uptake forecast: 5–7 PM with the student crowd.`;
      }
      setResult({ revenue, delay, waste, satisfaction, insight, chart });
      setRunning(false);
    }, 900);
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        <PageHeader icon={FlaskConical} title="Simulation Lab" description="What-if simulations for rush, shortage, delay & promotions" />

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-5 shadow-soft lg:col-span-1">
            <div className="font-semibold mb-3">Choose Scenario</div>
            <div className="space-y-2 mb-5">
              {SCENARIOS.map(s => (
                <button key={s.key} onClick={() => { setScenario(s.key); setResult(null); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${scenario === s.key ? "border-primary bg-primary/5 shadow-soft" : "border-border hover:bg-secondary/50"}`}>
                  <div className="font-medium text-sm">{s.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2"><span>Intensity</span><span className="font-semibold">{intensity[0]}%</span></div>
              <Slider value={intensity} onValueChange={setIntensity} max={100} step={5} />
            </div>
            <Button onClick={run} disabled={running} className="w-full"><Play className="w-4 h-4 mr-1.5" /> {running ? "Running…" : "Run Simulation"}</Button>
          </Card>

          <Card className="p-5 shadow-soft lg:col-span-2 min-h-[420px]">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <FlaskConical className="w-12 h-12 mb-3 opacity-40" />
                <div className="font-serif text-xl text-foreground">Ready to simulate</div>
                <div className="text-sm">Pick a scenario, adjust intensity, then hit Run.</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <KPI icon={TrendingUp} label="Revenue" value={formatINR(result.revenue)} />
                  <KPI icon={Clock} label="Avg Delay" value={`${result.delay} min`} />
                  <KPI icon={AlertTriangle} label="Waste" value={`${result.waste} g`} />
                  <KPI icon={Sparkles} label="Satisfaction" value={`${result.satisfaction}%`} />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={result.chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="baseline" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 4" name="Baseline" />
                    <Line type="monotone" dataKey="scenario" stroke="hsl(var(--primary))" strokeWidth={3} name="Simulated" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 rounded-lg bg-secondary/50 flex gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                  <span>{result.insight}</span>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function KPI({ icon: Icon, label, value }: any) {
  return (
    <div className="p-3 rounded-lg bg-secondary/40">
      <Icon className="w-4 h-4 text-primary mb-1" />
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-serif text-xl">{value}</div>
    </div>
  );
}
