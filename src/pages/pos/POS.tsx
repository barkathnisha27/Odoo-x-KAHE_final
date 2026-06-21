import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { useStore, formatINR, comboSuggestion, saveKitchenOrder } from "@/lib/store";
import { dedupeProducts, dedupeByKey } from "@/lib/dedupe";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Search, Plus, Minus, Trash2, Clock, Sparkles, Grid3x3, Send,
  AlertCircle, ChefHat, Tag as TagIcon, User, Power
} from "lucide-react";
import { toast } from "sonner";
import { DemoBadge } from "@/components/DemoBadge";

export default function POSTerminal() {
  const nav = useNavigate();
  const {
    products, categories, tables, floors, orders, coupons,
    createOrder, addItemToOrder, removeItemFromOrder, changeItemQty,
    applyDiscount, sendToKitchen, sendOrderToKitchen, getProductAvailability,
    sessionOpen, sessionOpenedAt, sessionClosedAt, lastClosingAmount,
    sessionEmployeeName, openSession, closeSession
  } = useStore();

  const uniqueFloors = useMemo(() => dedupeByKey(floors, (f) => `${f.cafe_id || "demo"}|${f.name}`), [floors]);
  const uniqueTables = useMemo(() => dedupeByKey(tables, (t) => `${t.cafe_id || "demo"}|${t.floor_id}|${t.table_number}`), [tables]);

  const location = useLocation();
  const [tableDialogOpen, setTableDialogOpen] = useState(!location.state?.orderId);
  const [activeFloor, setActiveFloor] = useState(uniqueFloors[0]?.id || "");
  const [currentTableId, setCurrentTableId] = useState<string | null>(location.state?.tableId || null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(location.state?.orderId || null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string | "all">("all");
  const [couponCode, setCouponCode] = useState("");
  
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "" });

  const currentTable = uniqueTables.find(t => t.id === currentTableId);
  const order = orders.find(o => o.id === currentOrderId);

  const rawFiltered = useMemo(() => products.filter(p =>
    (cat === "all" || p.category_id === cat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  ), [products, cat, search]);
  
  const filtered = useMemo(() => dedupeProducts(rawFiltered), [rawFiltered]);

  useEffect(() => {
    if (!order) return;
    let autoAmount = 0;
    
    coupons.filter(c => c.active && c.promo_type && c.promo_type !== "coupon").forEach(c => {
      let valid = false;
      if (c.promo_type === "auto_order" && order.subtotal >= (c.min_order_amount || 0)) valid = true;
      else if (c.promo_type === "auto_product") {
        const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
        if (totalQty >= (c.min_quantity || 0)) valid = true;
      }
      
      if (valid) {
        const amt = c.discount_type === "percentage" ? Math.round(order.subtotal * (c.discount_value / 100)) : c.discount_value;
        if (amt > autoAmount) autoAmount = amt;
      }
    });

    if (autoAmount > 0 && order.discount_amount !== autoAmount && !couponCode) {
      applyDiscount(order.id, autoAmount);
      toast.success("Auto promotion applied!");
    } else if (autoAmount === 0 && order.discount_amount > 0 && !couponCode) {
      applyDiscount(order.id, 0);
    }
  }, [order?.subtotal, order?.items, coupons, couponCode]);

  function selectTable(tableId: string) {
    const table = uniqueTables.find(t => t.id === tableId);
    if (!table) return;
    setCurrentTableId(tableId);
    setTableDialogOpen(false);
    // create order if needed
    if (table.current_order_id) {
      setCurrentOrderId(table.current_order_id);
    } else {
      const o = createOrder({ source: "POS", tableId });
      setCurrentOrderId(o.id);
    }
  }

  function add(productId: string) {
    if (!order) { toast.error("Pick a table first"); return; }
    const avail = getProductAvailability(productId);
    if (!avail.available) { toast.error("Sold out — ingredient unavailable"); return; }
    addItemToOrder(order.id, productId);
  }

  function applyCoupon() {
    if (!order) return;
    const c = coupons.find(x => x.code.toLowerCase() === couponCode.toLowerCase() && x.active);
    if (!c) { toast.error("Invalid coupon"); return; }
    const amount = c.discount_type === "percentage" ? Math.round(order.subtotal * (c.discount_value / 100)) : c.discount_value;
    applyDiscount(order.id, amount);
    toast.success(`${c.code} applied — ${formatINR(amount)} off`);
  }

  function send() {
    if (!order || !order.items || order.items.length === 0) {
      toast.error("Add items before sending to kitchen.");
      return;
    }
    if (!sessionOpen) {
      toast.error("Open POS session before sending orders.");
      return;
    }

    const savedOrder = sendOrderToKitchen({
      ...order,
      order_source: "pos",
      status: "to_cook",
      order_status: "to_cook",
      kitchen_status: "to_cook",
      customer_status: "sent_to_kitchen",
      payment_status: order.payment_status === "paid" ? "paid" : "pending",
      table_number: currentTable?.table_number ?? order.table_id ?? undefined,
    });
    
    saveKitchenOrder({
      ...order,
      order_source: "pos",
    });

    console.log("POS saved kitchen order:", savedOrder);
    console.log("Store orders after send:", useStore.getState().orders);

    setCurrentTableId(null);
    setCurrentOrderId(null);
    setTableDialogOpen(true);
    toast.success("Order sent to kitchen successfully.");
  }

  function payNow() {
    if (!order) return;
    nav(`/pay/${order.id}`);
  }

  function handleOpenSession() {
    openSession("Admin"); // Defaulting to Admin for now
    toast.success("POS session opened successfully");
  }

  function handleCloseSession() {
    closeSession();
    toast.success("POS session closed successfully");
  }

  function saveCustomer() {
    if (!order) { toast.error("Select a table first"); return; }
    useStore.getState().setOrderCustomer(order.id, customerForm.name, customerForm.email, customerForm.phone);
    setCustomerDialogOpen(false);
    toast.success("Customer assigned to order");
  }

  const combo = order ? comboSuggestion(order.items.map(i => i.product_id)) : null;
  const maxPrep = order?.items.reduce((m, i) => Math.max(m, i.prep_time_minutes), 0) ?? 0;
  const queue = orders.filter(o => o.order_status === "sent_to_kitchen" && o.kitchen_status !== "completed").length;
  const kitchenLoad = queue >= 6 ? "High" : queue >= 3 ? "Medium" : "Low";
  const eta = maxPrep + (queue >= 6 ? 10 : queue >= 3 ? 5 : 2);



  return (
    <AppShell>
      <DemoBadge />
      <div className="p-4 lg:p-6 h-screen flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl">POS Terminal</h1>
            <div className="text-sm text-muted-foreground">
              {currentTable ? <>Table <b className="text-foreground">{currentTable.table_number}</b> · {currentTable.seats} seats</> : "Select a table to begin"}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTableDialogOpen(true)}>
              <Grid3x3 className="w-4 h-4 mr-1.5" /> Tables
            </Button>
            <Button variant="outline" onClick={() => {
              if (order) {
                setCustomerForm({ name: order.customer_name || "", email: order.customer_email || "", phone: order.customer_phone || "" });
                setCustomerDialogOpen(true);
              } else {
                toast.error("Select a table first");
              }
            }}>
              <User className="w-4 h-4 mr-1.5" /> Customer
            </Button>
            <Button variant="outline" onClick={() => nav("/pos/orders")}>Orders</Button>
            <Button variant="outline" onClick={() => nav("/kds")}>Kitchen</Button>
          </div>
        </div>

        {/* Session Panel */}
        <Card className="mb-4 p-3 flex items-center justify-between shadow-sm bg-secondary/20 border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Session Status:</span>
              <Badge variant={sessionOpen ? "default" : "destructive"}>{sessionOpen ? "Open" : "Closed"}</Badge>
            </div>
            {sessionOpen && sessionOpenedAt && (
              <div className="text-xs text-muted-foreground hidden md:block">
                Opened at: {new Date(sessionOpenedAt).toLocaleString()} by {sessionEmployeeName}
              </div>
            )}
            {!sessionOpen && sessionClosedAt && (
              <div className="text-xs text-muted-foreground hidden md:block">
                Last closed: {new Date(sessionClosedAt).toLocaleString()} | Summary: {formatINR(lastClosingAmount)}
              </div>
            )}
          </div>
          <div>
            {sessionOpen ? (
              <Button variant="destructive" size="sm" onClick={handleCloseSession}>
                <Power className="w-3.5 h-3.5 mr-1.5" /> Close Session
              </Button>
            ) : (
              <Button size="sm" onClick={handleOpenSession}>Open Session</Button>
            )}
          </div>
        </Card>

        <div className="grid lg:grid-cols-[1fr_400px] gap-4 flex-1 overflow-hidden">
          {/* Products */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex gap-2 mb-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <button onClick={() => setCat("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${cat === "all" ? "bg-foreground text-background border-foreground" : "bg-card border-border"}`}>All</button>
              {categories.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${cat === c.id ? "text-white border-transparent" : "bg-card border-border"}`} style={cat === c.id ? { background: c.color } : {}}>{c.name}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-1 scrollbar-thin pb-4 content-start">
              {filtered.map(p => {
                const avail = getProductAvailability(p.id);
                const catObj = categories.find(c => c.id === p.category_id);
                return (
                  <button
                    key={p.id}
                    onClick={() => add(p.id)}
                    disabled={!avail.available}
                    className={`text-left rounded-xl p-3 border bg-card hover:shadow-elevated transition-all ${!avail.available ? "opacity-50" : ""}`}
                    style={{ borderTopColor: catObj?.color, borderTopWidth: 3 }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-sm leading-tight">{p.name}</div>
                      {p.is_popular && <Badge variant="secondary" className="text-[9px] h-4 px-1.5">★</Badge>}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-2.5 h-2.5" /> {p.prep_time_minutes}m · {p.station.split(" ")[0]}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-serif text-base">{formatINR(p.price)}</span>
                      <span className={`text-[10px] font-medium ${p.stock_qty < 5 ? "text-destructive" : "text-muted-foreground"}`}>
                        {p.stock_qty === 0 ? "SOLD OUT" : p.stock_qty < 5 ? "LOW" : `${p.stock_qty} in stock`}
                      </span>
                    </div>
                    {avail.lowIngredient && avail.available && (
                      <div className="text-[9px] text-warning mt-1 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> Low: {avail.lowIngredient}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart */}
          <Card className="flex flex-col overflow-hidden shadow-elevated">
            <div className="p-4 border-b border-border">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Current Order</div>
              <div className="font-serif text-xl">{order?.order_number ?? "—"}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              {order && order.items.length > 0 ? order.items.map(item => (
                <div key={item.id} className="p-2.5 rounded-lg bg-secondary/40">
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-medium text-sm">{item.product_name}</div>
                    <div className="font-semibold text-sm">{formatINR(item.line_total)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => changeItemQty(order.id, item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                    <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => changeItemQty(order.id, item.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                    <span className="text-xs text-muted-foreground ml-2">{formatINR(item.unit_price)} ea</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto text-destructive" onClick={() => removeItemFromOrder(order.id, item.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Tap products to add to cart
                </div>
              )}
            </div>

            {/* AI panel */}
            {order && order.items.length > 0 && (
              <div className="px-3 py-2 border-t border-border bg-gradient-to-b from-secondary/30 to-card text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> ETA</span>
                  <span className="font-semibold">{eta} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kitchen load</span>
                  <span className={`font-semibold ${kitchenLoad === "High" ? "text-destructive" : kitchenLoad === "Medium" ? "text-warning" : "text-accent"}`}>{kitchenLoad}</span>
                </div>
                {combo && (
                  <div className="p-2 rounded-md gradient-warm text-white flex gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{combo}</span>
                  </div>
                )}
              </div>
            )}

            <div className="p-3 border-t border-border bg-card space-y-2">
              <div className="flex gap-1.5">
                <Input placeholder="Coupon" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="h-8 text-xs" />
                <Button variant="outline" size="sm" className="h-8" onClick={applyCoupon}><TagIcon className="w-3 h-3" /></Button>
              </div>
              <Row label="Subtotal" value={formatINR(order?.subtotal ?? 0)} />
              <Row label="Tax (5%)" value={formatINR(order?.tax_amount ?? 0)} />
              {order && order.discount_amount > 0 && <Row label="Discount" value={`- ${formatINR(order.discount_amount)}`} accent />}
              <Row label="Total" value={formatINR(order?.total_amount ?? 0)} big />
              <div className="grid grid-cols-2 gap-2 pt-1">
                {!sessionOpen ? (
                  <div className="col-span-2 text-center text-xs text-destructive font-medium p-2 bg-destructive/10 rounded-md">
                    Open POS session to take orders.
                  </div>
                ) : (
                  <>
                    <Button variant="outline" onClick={send} disabled={!order || order.items.length === 0}>
                      <Send className="w-4 h-4 mr-1" /> To Kitchen
                    </Button>
                    <Button onClick={payNow} disabled={!order || order.items.length === 0}>Pay</Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Floor / table picker */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Select a table</DialogTitle></DialogHeader>
          <div className="flex gap-2 border-b border-border pb-3">
            {uniqueFloors.map(f => (
              <button key={f.id} onClick={() => setActiveFloor(f.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeFloor === f.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                {f.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-3">
            {uniqueTables.filter(t => t.floor_id === activeFloor).map(t => {
              const colorMap: Record<string, string> = {
                available: "bg-status-available/15 text-status-available border-status-available/40",
                ordering: "bg-status-ordering/15 text-status-ordering border-status-ordering/40",
                kitchen: "bg-status-kitchen/15 text-status-kitchen border-status-kitchen/40",
                preparing: "bg-status-preparing/15 text-status-preparing border-status-preparing/40",
                ready: "bg-status-ready/15 text-status-ready border-status-ready/40",
                payment: "bg-status-payment/15 text-status-payment border-status-payment/40",
                paid: "bg-status-paid/15 text-status-paid border-status-paid/40",
              };
              return (
                <button
                  key={t.id}
                  onClick={() => selectTable(t.id)}
                  className={`p-4 rounded-xl border-2 ${colorMap[t.status]} hover:scale-105 transition-transform text-left`}
                >
                  <div className="font-serif text-2xl">T{t.table_number}</div>
                  <div className="text-xs mt-1 capitalize">{t.status}</div>
                  <div className="text-[10px] text-muted-foreground">{t.seats} seats</div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Name</label>
              <Input placeholder="John Doe" value={customerForm.name} onChange={e => setCustomerForm(s => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Email</label>
              <Input type="email" placeholder="john@example.com" value={customerForm.email} onChange={e => setCustomerForm(s => ({ ...s, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Phone</label>
              <Input placeholder="1234567890" value={customerForm.phone} onChange={e => setCustomerForm(s => ({ ...s, phone: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={saveCustomer}>Save to Order</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Row({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${big ? "pt-2 border-t border-border font-semibold" : ""} ${accent ? "text-accent" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={big ? "font-serif text-lg" : ""}>{value}</span>
    </div>
  );
}
