import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore, formatINR, saveKitchenOrder } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2, Clock, Coffee, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { DemoBadge } from "@/components/DemoBadge";

export default function QrOrder() {
  const { token } = useParams();
  const nav = useNavigate();
  const { 
    tables, 
    products, 
    categories, 
    orders, 
    createOrder, 
    addItemToOrder, 
    removeItemFromOrder, 
    changeItemQty, 
    sendToKitchen, 
    sendOrderToKitchen,
    getProductAvailability,
    setCurrentCafeId
  } = useStore();

  // Parse cafe_id and table_id from token
  const { parsedCafeId, parsedTableId } = useMemo(() => {
    let cafeId = "demo-cafe-1";
    let tableId = "t3";
    
    if (token) {
      try {
        // Try base64 JSON
        const decoded = atob(token);
        const obj = JSON.parse(decoded);
        if (obj.cafe_id) cafeId = obj.cafe_id;
        if (obj.table_id) tableId = obj.table_id;
      } catch (e) {
        // Try cafeId_tableId
        if (token.includes("_")) {
          const parts = token.split("_");
          cafeId = parts[0];
          tableId = parts[1];
        } else {
          // Legacy/Seed lookup
          const matchedTable = tables.find(t => t.qr_token === token);
          if (matchedTable) {
            cafeId = matchedTable.cafe_id;
            tableId = matchedTable.id;
          }
        }
      }
    }
    return { parsedCafeId: cafeId, parsedTableId: tableId };
  }, [token, tables]);

  // Sync workspace ID on mount/token change
  useEffect(() => {
    setCurrentCafeId(parsedCafeId);
  }, [parsedCafeId, setCurrentCafeId]);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [cat, setCat] = useState<string | "all">("all");
  const order = orders.find(o => o.id === orderId);

  // Scope entities to active cafe
  const cafeTables = useMemo(() => tables.filter(t => t.cafe_id === parsedCafeId), [tables, parsedCafeId]);
  const table = useMemo(() => cafeTables.find(t => t.id === parsedTableId) || cafeTables[0] || tables[2], [cafeTables, parsedTableId, tables]);
  
  const cafeCategories = useMemo(() => categories.filter(c => c.cafe_id === parsedCafeId), [categories, parsedCafeId]);
  const cafeProducts = useMemo(() => products.filter(p => p.cafe_id === parsedCafeId), [products, parsedCafeId]);

  const filtered = useMemo(() => cafeProducts.filter(p => cat === "all" || p.category_id === cat), [cafeProducts, cat]);

  function ensureOrder() {
    if (order) return order;
    const o = createOrder({ source: "QR", tableId: table.id, customerName: `Guest · T${table.table_number}` });
    setOrderId(o.id);
    return o;
  }

  function add(pid: string) {
    const a = getProductAvailability(pid);
    if (!a.available) { toast.error("Sold out"); return; }
    const o = ensureOrder();
    addItemToOrder(o.id, pid);
  }

  function place() {
    if (!order || !order.items || order.items.length === 0) {
      toast.error("Add items before sending to kitchen.");
      return;
    }

    sendOrderToKitchen({
      ...order,
      order_source: "qr_table",
      status: "to_cook",
      order_status: "to_cook",
      kitchen_status: "to_cook",
      customer_status: "sent_to_kitchen",
      payment_status: order.payment_status === "paid" ? "paid" : "pending",
      table_number: table?.table_number ?? order.table_number,
    });
    
    saveKitchenOrder({
      ...order,
      order_source: "qr_table",
    });
    
    toast.success("Order sent to kitchen successfully.");
    nav(`/customer-display/${order.id}`);
  }

  return (
    <div className="min-h-screen bg-secondary/30 pb-32">
      <DemoBadge />
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="container py-3">
          <div className="flex items-center gap-2 mb-1">
            <Coffee className="w-5 h-5 text-primary" />
            <span className="font-serif text-xl">DineFlow</span>
            <Badge variant="secondary" className="ml-2 text-xs">Table {table.table_number}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">Scan, order, sit back. No login needed.</div>
        </div>
        <div className="container pb-3 flex gap-2 overflow-x-auto scrollbar-thin">
          <button onClick={() => setCat("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${cat === "all" ? "bg-foreground text-background" : "bg-card border-border"}`}>All</button>
          {cafeCategories.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${cat === c.id ? "text-white border-transparent" : "bg-card border-border"}`} style={cat === c.id ? { background: c.color } : {}}>{c.name}</button>
          ))}
        </div>
      </header>

      <div className="container py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map(p => {
          const a = getProductAvailability(p.id);
          const inCart = order?.items.find(i => i.product_id === p.id);
          return (
            <Card key={p.id} className="p-3">
              <div className="font-semibold text-sm">{p.name}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-2.5 h-2.5" /> {p.prep_time_minutes} min</div>
              <div className="font-serif text-lg mt-1">{formatINR(p.price)}</div>
              {inCart ? (
                <div className="flex items-center gap-1 mt-2">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeItemQty(order!.id, inCart.id, inCart.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                  <span className="flex-1 text-center text-sm font-semibold">{inCart.quantity}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeItemQty(order!.id, inCart.id, inCart.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                </div>
              ) : (
                <Button size="sm" className="w-full mt-2 h-7" disabled={!a.available} onClick={() => add(p.id)}>
                  {a.available ? <><Plus className="w-3 h-3 mr-1" /> Add</> : "Sold out"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {order && order.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-elevated z-30 animate-slide-up">
          <div className="container flex items-center gap-3">
            <div>
              <div className="text-xs text-muted-foreground">{order.items.reduce((s, i) => s + i.quantity, 0)} items</div>
              <div className="font-serif text-xl">{formatINR(order.total_amount)}</div>
            </div>
            <Button size="lg" className="flex-1" onClick={place}>
              <ShoppingCart className="w-4 h-4 mr-1.5" /> Place order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

