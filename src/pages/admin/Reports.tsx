import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Download, FileSpreadsheet, FileText, TrendingUp } from "lucide-react";
import { useStore, formatINR } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { exportToPDF, exportToXLSX } from "@/lib/exporters";

const SALES_TREND = [
  { day: "Mon", revenue: 8400, orders: 42 }, { day: "Tue", revenue: 9200, orders: 48 },
  { day: "Wed", revenue: 7800, orders: 39 }, { day: "Thu", revenue: 10100, orders: 52 },
  { day: "Fri", revenue: 13400, orders: 68 }, { day: "Sat", revenue: 15200, orders: 78 },
  { day: "Sun", revenue: 11800, orders: 61 },
];
const PAYMENTS = [{ method: "Cash", amount: 28400 }, { method: "UPI", amount: 32100 }, { method: "Card", amount: 15400 }];
const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--terracotta))"];

export default function Reports() {
  const { products, orders, categories } = useStore();
  const totalRevenue = SALES_TREND.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = SALES_TREND.reduce((s, d) => s + d.orders, 0);

  const productRows = [...products].sort((a, b) => b.sold_today - a.sold_today).map(p => ({
    Product: p.name, Category: categories.find(c => c.id === p.category_id)?.name || "",
    Price: p.price, "Sold Today": p.sold_today, Revenue: p.sold_today * p.price, Stock: p.stock_qty,
  }));

  const handlePDF = () => {
    exportToPDF("dineflow-report", "DineFlow Reports & Analytics", [
      { heading: "Sales by Day", columns: ["Day", "Revenue", "Orders"], rows: SALES_TREND.map(d => [d.day, formatINR(d.revenue), d.orders]) },
      { heading: "Payment Methods", columns: ["Method", "Amount"], rows: PAYMENTS.map(p => [p.method, formatINR(p.amount)]) },
      { heading: "Product Performance", columns: ["Product", "Category", "Price", "Sold", "Revenue"], rows: productRows.map(r => [r.Product, r.Category, formatINR(r.Price), r["Sold Today"], formatINR(r.Revenue)]) },
    ]);
  };
  const handleXLSX = () => {
    exportToXLSX("dineflow-report", [
      { name: "Sales", rows: SALES_TREND },
      { name: "Payments", rows: PAYMENTS },
      { name: "Products", rows: productRows },
      { name: "Orders", rows: orders.map(o => ({ Number: o.order_number, Source: o.source, Items: o.items.length, Total: o.total_amount, Status: o.order_status, Payment: o.payment_status, Created: o.created_at })) },
    ]);
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        <PageHeader icon={BarChart3} title="Reports & Analytics" description="Sales, products, payments and prediction reports"
          actions={<>
            <Button variant="outline" onClick={handlePDF}><FileText className="w-4 h-4 mr-1.5" /> Export PDF</Button>
            <Button variant="outline" onClick={handleXLSX}><FileSpreadsheet className="w-4 h-4 mr-1.5" /> Export Excel</Button>
          </>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 shadow-soft"><div className="text-xs text-muted-foreground">Week Revenue</div><div className="font-serif text-2xl">{formatINR(totalRevenue)}</div><div className="text-xs text-success">+22%</div></Card>
          <Card className="p-4 shadow-soft"><div className="text-xs text-muted-foreground">Week Orders</div><div className="font-serif text-2xl">{totalOrders}</div><div className="text-xs text-success">+18%</div></Card>
          <Card className="p-4 shadow-soft"><div className="text-xs text-muted-foreground">Avg Order</div><div className="font-serif text-2xl">{formatINR(totalRevenue / totalOrders)}</div></Card>
          <Card className="p-4 shadow-soft"><div className="text-xs text-muted-foreground">Best Day</div><div className="font-serif text-2xl">Sat</div><div className="text-xs text-muted-foreground">{formatINR(15200)}</div></Card>
        </div>

        <Tabs defaultValue="sales">
          <TabsList><TabsTrigger value="sales">Sales</TabsTrigger><TabsTrigger value="products">Products</TabsTrigger><TabsTrigger value="payments">Payments</TabsTrigger></TabsList>

          <TabsContent value="sales" className="mt-4">
            <Card className="p-5 shadow-soft">
              <div className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> 7-Day Revenue</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={SALES_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} />
                  <Line type="monotone" dataKey="orders" stroke="hsl(var(--accent))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <Card className="p-5 shadow-soft">
              <div className="font-semibold mb-3">Product Performance</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productRows.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="Product" fontSize={11} stroke="hsl(var(--muted-foreground))" width={70} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card className="p-5 shadow-soft">
              <div className="font-semibold mb-3">Payment Breakdown</div>
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={PAYMENTS} dataKey="amount" nameKey="method" innerRadius={50} outerRadius={90} paddingAngle={3}>
                      {PAYMENTS.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {PAYMENTS.map((p, i) => (
                    <div key={p.method} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} /><span className="font-medium">{p.method}</span></div>
                      <div className="font-serif text-lg">{formatINR(p.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
