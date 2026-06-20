import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, formatINR, comboSuggestion } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Search, Plus, Minus, Trash2, Clock, Sparkles, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DemoBadge } from "@/components/DemoBadge";

export default function CustomerMenu() {
  const nav = useNavigate();
  const { products, categories, customer, createOrder, addItemToOrder, removeItemFromOrder, changeItemQty, applyDiscount, sendToKitchen, getProductAvailability, coupons, orders } = useStore();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string | "all">("all");
  const [cartOrderId, setCartOrderId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");

  const order = orders.find(o => o.id === cartOrderId);

  const filtered = useMemo(() => products.filter(p =>
    (cat === "all" || p.category_id === cat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  ), [products, cat, search]);

  function ensureOrder() {
    if (order) return order;
    const o = createOrder({ source: "Customer", customerId: customer.id, customerName: customer.name });
    setCartOrderId(o.id);
    return o;
  }

  function add(productId: string) {
    const avail = getProductAvailability(productId);
    if (!avail.available) { toast.error("Sold out — ingredient unavailable"); return; }
    const o = ensureOrder();
    addItemToOrder(o.id, productId);
    toast.success("Added to cart");
  }

  function applyCoupon() {
    if (!order) return;
    const c = coupons.find(x => x.code.toLowerCase() === coupon.toLowerCase() && x.active);
    if (!c) { toast.error("Invalid coupon"); return; }
    const amount = c.discount_type === "percentage" ? Math.round(order.subtotal * (c.discount_value / 100)) : c.discount_value;
    applyDiscount(order.id, amount);
    toast.success(`Coupon applied — ${formatINR(amount)} off`);
  }

  function placeOrder() {
    if (!order || order.items.length === 0) return;
    sendToKitchen(order.id);
    toast.success("Order sent to kitchen! Tracking live.");
    nav("/customer");
  }

  const combo = order ? comboSuggestion(order.items.map(i => i.product_id)) : null;
  const cartCount = order?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <DemoBadge />
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => nav("/customer")}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <div className="font-serif text-xl leading-none">Menu</div>
            <div className="text-xs text-muted-foreground mt-0.5">Tap to add · ETAs are live</div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="default" className="relative">
                <ShoppingCart className="w-4 h-4 mr-1.5" /> Cart
                {cartCount > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-terracotta">{cartCount}</span>}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
              <SheetHeader><SheetTitle className="font-serif">Your Order</SheetTitle></SheetHeader>
              {!order || order.items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Cart is empty.</div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto py-4 space-y-2">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/40">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.product_name}</div>
                          <div className="text-xs text-muted-foreground">{formatINR(item.unit_price)} · {item.station}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeItemQty(order.id, item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                          <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeItemQty(order.id, item.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItemFromOrder(order.id, item.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                        <div className="font-semibold text-sm w-16 text-right">{formatINR(item.line_total)}</div>
                      </div>
                    ))}
                    {combo && (
                      <div className="p-3 rounded-lg gradient-warm text-white text-sm flex gap-2">
                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" /><span>{combo}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border pt-4 space-y-2 text-sm">
                    <div className="flex gap-2">
                      <Input placeholder="Coupon code (try COFFEE10)" value={coupon} onChange={e => setCoupon(e.target.value)} />
                      <Button variant="outline" onClick={applyCoupon}>Apply</Button>
                    </div>
                    <Row label="Subtotal" value={formatINR(order.subtotal)} />
                    <Row label="Tax (5%)" value={formatINR(order.tax_amount)} />
                    {order.discount_amount > 0 && <Row label="Discount" value={`- ${formatINR(order.discount_amount)}`} accent />}
                    <Row label="Total" value={formatINR(order.total_amount)} big />
                    <Button className="w-full" size="lg" onClick={placeOrder}>Place order</Button>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
        <div className="container pb-3 flex gap-2 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search dishes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="container pb-3 flex gap-2 overflow-x-auto scrollbar-thin">
          <CatChip label="All" active={cat === "all"} onClick={() => setCat("all")} />
          {categories.map(c => <CatChip key={c.id} label={c.name} color={c.color} active={cat === c.id} onClick={() => setCat(c.id)} />)}
        </div>
      </header>

      <div className="container py-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(p => {
          const avail = getProductAvailability(p.id);
          const catObj = categories.find(c => c.id === p.category_id);
          return (
            <Card key={p.id} className="overflow-hidden hover:shadow-elevated transition-all">
              <div className="h-24 bg-gradient-to-br" style={{ background: `linear-gradient(135deg, ${catObj?.color}40, ${catObj?.color}15)` }}>
                <div className="p-3 flex justify-between">
                  {p.is_popular && <Badge className="bg-terracotta text-terracotta-foreground border-0 text-[10px]">Popular</Badge>}
                  {!avail.available && <Badge variant="destructive" className="text-[10px]">Sold out</Badge>}
                  {avail.available && avail.lowIngredient && <Badge variant="outline" className="text-[10px] bg-warning/20 text-warning-foreground border-warning/40 ml-auto">Low: {avail.lowIngredient}</Badge>}
                </div>
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm leading-tight">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {p.prep_time_minutes} min
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="font-serif text-lg">{formatINR(p.price)}</div>
                  <Button size="sm" disabled={!avail.available} onClick={() => add(p.id)}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            No dishes match your search.
          </div>
        )}
      </div>
    </div>
  );
}

function CatChip({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${active ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:border-foreground/40"}`}
      style={active && color ? { background: color, borderColor: color, color: "white" } : {}}
    >
      {label}
    </button>
  );
}

function Row({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${big ? "text-base font-semibold pt-2 border-t" : ""} ${accent ? "text-accent" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={big ? "font-serif text-lg" : ""}>{value}</span>
    </div>
  );
}
