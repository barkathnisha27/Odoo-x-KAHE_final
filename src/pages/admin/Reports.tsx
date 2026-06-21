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
import { toast } from "sonner";
import { dedupeByKey, dedupeProducts } from "@/lib/dedupe";

const SALES_TREND = [
  { day: "Mon", revenue: 8400, orders: 42 }, { day: "Tue", revenue: 9200, orders: 48 },
  { day: "Wed", revenue: 7800, orders: 39 }, { day: "Thu", revenue: 10100, orders: 52 },
  { day: "Fri", revenue: 13400, orders: 68 }, { day: "Sat", revenue: 15200, orders: 78 },
  { day: "Sun", revenue: 11800, orders: 61 },
];
const PAYMENTS = [{ method: "Cash", amount: 28400 }, { method: "UPI", amount: 32100 }, { method: "Card", amount: 15400 }];
const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--terracotta))"];

export default function Reports() {
  const { products: rawProducts, categories, orders } = useStore();
  const products = dedupeProducts(rawProducts);
  const ingredients = dedupeByKey(useStore.getState().ingredients || [], i => `${i.cafe_id || "demo"}|${i.name}`);

  // Dynamic Summary calculations from actual store state
  const paidOrders = orders.filter(o => o.payment_status === "paid");
  const totalRevenue = paidOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  const totalOrders = paidOrders.length;

  const productRows = [...products].sort((a, b) => b.sold_today - a.sold_today).map(p => ({
    Product: p.name,
    Category: categories.find(c => c.id === p.category_id)?.name || "",
    Price: p.price,
    "Sold Today": p.sold_today,
    Revenue: p.sold_today * p.price,
    Stock: p.stock_qty,
  }));

  // ── 1. Sales Report ──────────────────────────────────────────────────────
  const salesReportRows = orders.map(o => {
    const subtotal = Number(o.subtotal) || 0;
    const discount = Number(o.discount_amount) || 0;
    const tax = Number(o.tax_amount) || 0;
    // Recompute total to guarantee accuracy
    const total = subtotal + tax - discount;
    const customerLabel = o.customer_name || (o.table_id ? `Table ${o.table_id}` : "POS Walk-in");
    return {
      orderId: o.order_number || o.id,
      date: o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN") : "-",
      customer: customerLabel,
      paymentMethod: o.payment_method || "—",
      // Numeric values for Excel/CSV — formatted string only for PDF display
      subtotalNum: subtotal,
      discountNum: discount,
      taxNum: tax,
      totalNum: Math.max(0, total),
      status: o.payment_status || "unpaid",
    };
  });

  // ── 2. Orders Report (per line item) ─────────────────────────────────────
  const ordersReportRows: {
    orderId: string; productName: string; quantity: number;
    unitPriceNum: number; subtotalNum: number; taxNum: number; lineTotalNum: number; status: string;
  }[] = [];

  orders.forEach(o => {
    (o.items || []).forEach(item => {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const lineSubtotal = qty * unitPrice;
      const lineTax = lineSubtotal * 0.05;
      const lineTotal = lineSubtotal + lineTax;
      ordersReportRows.push({
        orderId: o.order_number || o.id,
        productName: item.product_name,
        quantity: qty,
        unitPriceNum: unitPrice,
        subtotalNum: lineSubtotal,
        taxNum: lineTax,
        lineTotalNum: lineTotal,
        status: o.order_status,
      });
    });
  });

  // ── 3. Product Report ─────────────────────────────────────────────────────
  const productReportRows = products.map(p => {
    const catName = categories.find(c => c.id === p.category_id)?.name || "Uncategorized";
    const qty = Number(p.sold_today) || 0;
    const price = Number(p.price) || 0;
    const rev = qty * price;
    return {
      productName: p.name,
      category: catName,
      qtySold: qty,
      unitPriceNum: price,
      revenueNum: rev,
      stock: p.stock_qty || 0,
      prepTime: `${p.prep_time_minutes || 0} mins`,
    };
  });

  // ── 4. Ingredient Report ──────────────────────────────────────────────────
  const ingredientReportRows = ingredients.map(ing => ({
    name: ing.name,
    unit: ing.unit || "g",
    stockNum: Number(ing.current_stock) || 0,
    minStockNum: Number(ing.min_stock_level) || 0,
    usedQtyNum: Number(ing.used_today) || 0,
    costPerUnitNum: Number(ing.cost_per_unit) || 0,
    estCostNum: (Number(ing.used_today) || 0) * (Number(ing.cost_per_unit) || 0),
    restockNeeded: (Number(ing.current_stock) || 0) < (Number(ing.min_stock_level) || 0) ? "Yes" : "No",
  }));

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt = (n: number) => Number(n || 0).toFixed(2);

  // ── PDF Export ────────────────────────────────────────────────────────────
  const handlePDF = () => {
    try {
      exportToPDF("dineflow_sales_report", "DineFlow Sales & Operations Report", [
        {
          heading: "Sales Summary",
          columns: ["Order ID", "Date", "Customer/Table", "Payment", "Subtotal (₹)", "Discount (₹)", "Tax 5% (₹)", "Total (₹)", "Status"],
          rows: salesReportRows.map(r => [
            r.orderId, r.date, r.customer, r.paymentMethod,
            fmt(r.subtotalNum), fmt(r.discountNum), fmt(r.taxNum), fmt(r.totalNum), r.status,
          ]),
        },
        {
          heading: "Order Line Items",
          columns: ["Order ID", "Product", "Qty", "Unit Price (₹)", "Subtotal (₹)", "Tax 5% (₹)", "Line Total (₹)", "Status"],
          rows: ordersReportRows.map(r => [
            r.orderId, r.productName, r.quantity,
            fmt(r.unitPriceNum), fmt(r.subtotalNum), fmt(r.taxNum), fmt(r.lineTotalNum), r.status,
          ]),
        },
        {
          heading: "Product Performance",
          columns: ["Product", "Category", "Qty Sold", "Unit Price (₹)", "Revenue (₹)", "Stock", "Prep Time"],
          rows: productReportRows.map(r => [
            r.productName, r.category, r.qtySold, fmt(r.unitPriceNum), fmt(r.revenueNum), r.stock, r.prepTime,
          ]),
        },
        {
          heading: "Ingredient Inventory",
          columns: ["Ingredient", "Unit", "Stock", "Min Stock", "Used Today", "Cost/Unit (₹)", "Est. Cost (₹)", "Restock?"],
          rows: ingredientReportRows.map(r => [
            r.name, r.unit, r.stockNum, r.minStockNum, r.usedQtyNum, fmt(r.costPerUnitNum), fmt(r.estCostNum), r.restockNeeded,
          ]),
        },
      ]);
      toast.success("PDF Report downloaded.");
    } catch (e) {
      toast.error("Failed to generate PDF");
    }
  };

  // ── Excel Export ──────────────────────────────────────────────────────────
  const handleXLSX = () => {
    try {
      exportToXLSX("dineflow_sales_report", [
        {
          name: "Sales",
          rows: salesReportRows.map(r => ({
            "Order ID": r.orderId,
            Date: r.date,
            "Customer/Table": r.customer,
            "Payment Method": r.paymentMethod,
            "Subtotal (₹)": r.subtotalNum,
            "Discount (₹)": r.discountNum,
            "Tax 5% (₹)": r.taxNum,
            "Total (₹)": r.totalNum,
            Status: r.status,
          })),
        },
        {
          name: "Order Items",
          rows: ordersReportRows.map(r => ({
            "Order ID": r.orderId,
            Product: r.productName,
            Quantity: r.quantity,
            "Unit Price (₹)": r.unitPriceNum,
            "Subtotal (₹)": r.subtotalNum,
            "Tax 5% (₹)": r.taxNum,
            "Line Total (₹)": r.lineTotalNum,
            Status: r.status,
          })),
        },
        {
          name: "Products",
          rows: productReportRows.map(r => ({
            Product: r.productName,
            Category: r.category,
            "Qty Sold": r.qtySold,
            "Unit Price (₹)": r.unitPriceNum,
            "Revenue (₹)": r.revenueNum,
            Stock: r.stock,
            "Prep Time": r.prepTime,
          })),
        },
        {
          name: "Ingredients",
          rows: ingredientReportRows.map(r => ({
            Ingredient: r.name,
            Unit: r.unit,
            "Stock": r.stockNum,
            "Min Stock": r.minStockNum,
            "Used Today": r.usedQtyNum,
            "Cost/Unit (₹)": r.costPerUnitNum,
            "Est. Cost (₹)": r.estCostNum,
            "Restock Needed": r.restockNeeded,
          })),
        },
        {
          name: "Prediction Dataset",
          rows: (() => {
            const rows: Record<string, unknown>[] = [];
            orders.forEach(o => {
              const dateStr = o.created_at ? o.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
              const hour = o.created_at ? new Date(o.created_at).getHours() : 12;
              (o.items || []).forEach(item => {
                const p = products.find(prod => prod.id === item.product_id);
                const catName = p ? (categories.find(c => c.id === p.category_id)?.name || "Uncategorized") : "Uncategorized";
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unit_price) || 0;
                rows.push({
                  Date: dateStr,
                  Product: item.product_name,
                  Quantity: qty,
                  "Revenue (₹)": qty * price,
                  Hour: hour,
                  Category: catName,
                  "Payment Method": o.payment_method || "Cash",
                  "Prep Time (min)": item.prep_time_minutes || 5,
                  Delay: o.delay_status || "on_time",
                });
              });
            });
            return rows;
          })(),
        },
      ]);
      toast.success("Excel Report downloaded.");
    } catch (e) {
      toast.error("Failed to generate Excel");
    }
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
          <Card className="p-4 shadow-soft"><div className="text-xs text-muted-foreground">Avg Order</div><div className="font-serif text-2xl">{formatINR(totalOrders > 0 ? totalRevenue / totalOrders : 0)}</div></Card>
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
