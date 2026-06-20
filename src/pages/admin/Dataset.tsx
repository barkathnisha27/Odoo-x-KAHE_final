import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table as T, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Download, Sparkles } from "lucide-react";
import { exportToXLSX, exportToPDF } from "@/lib/exporters";

// Synthetic training dataset for the demo predictions
const DATASET = Array.from({ length: 28 }, (_, i) => {
  const date = new Date(Date.now() - (27 - i) * 86400000).toISOString().slice(0, 10);
  const day = new Date(date).getDay();
  const isWeekend = day === 0 || day === 6;
  const orders = Math.round((isWeekend ? 70 : 50) + Math.sin(i / 3) * 8 + Math.random() * 10);
  const revenue = orders * (180 + Math.round(Math.random() * 40));
  const peakHour = isWeekend ? 19 + Math.round(Math.random()) : 13 + Math.round(Math.random() * 2);
  return {
    date, weekday: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day],
    orders, revenue, avg_ticket: Math.round(revenue / orders),
    peak_hour: `${peakHour}:00`, weather: ["Sunny","Cloudy","Rainy"][Math.floor(Math.random() * 3)],
    promotion: i % 5 === 0 ? "WEEKEND10" : "—",
    wastage_g: 150 + Math.round(Math.random() * 200),
  };
});

export default function Dataset() {
  const xlsx = () => exportToXLSX("dineflow-dataset", [{ name: "Training Data", rows: DATASET }]);
  const pdf = () => exportToPDF("dineflow-dataset", "DineFlow Prediction Dataset", [
    { heading: "Last 28 Days", columns: ["Date","Day","Orders","Revenue","Avg","Peak","Weather","Promo","Waste(g)"],
      rows: DATASET.map(d => [d.date, d.weekday, d.orders, d.revenue, d.avg_ticket, d.peak_hour, d.weather, d.promotion, d.wastage_g]) }
  ]);

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader icon={Database} title="Prediction Dataset" description="Historical training data feeding the AI forecasting engine"
          actions={<>
            <Button variant="outline" onClick={pdf}><Download className="w-4 h-4 mr-1.5" /> PDF</Button>
            <Button variant="outline" onClick={xlsx}><Download className="w-4 h-4 mr-1.5" /> Excel</Button>
          </>}
        />

        <div className="grid md:grid-cols-4 gap-3 mb-5">
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Records</div><div className="font-serif text-2xl">{DATASET.length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Features</div><div className="font-serif text-2xl">9</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Model</div><div className="font-serif text-lg">Gemini-Forecast</div></Card>
          <Card className="p-3 shadow-soft bg-gradient-to-br from-secondary/40 to-card border-primary/20">
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-terracotta" /><div className="text-xs text-muted-foreground">Accuracy</div></div>
            <div className="font-serif text-2xl">94.2%</div>
          </Card>
        </div>

        <Card className="shadow-soft overflow-x-auto">
          <T>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Day</TableHead><TableHead>Orders</TableHead><TableHead>Revenue</TableHead>
                <TableHead>Avg ticket</TableHead><TableHead>Peak</TableHead><TableHead>Weather</TableHead><TableHead>Promo</TableHead><TableHead>Waste (g)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DATASET.slice().reverse().map(d => (
                <TableRow key={d.date}>
                  <TableCell className="font-mono text-xs">{d.date}</TableCell>
                  <TableCell>{d.weekday}</TableCell>
                  <TableCell>{d.orders}</TableCell>
                  <TableCell>₹{d.revenue.toLocaleString("en-IN")}</TableCell>
                  <TableCell>₹{d.avg_ticket}</TableCell>
                  <TableCell>{d.peak_hour}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{d.weather}</Badge></TableCell>
                  <TableCell>{d.promotion}</TableCell>
                  <TableCell>{d.wastage_g}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </T>
        </Card>
      </div>
    </AppShell>
  );
}
