import { Link, useNavigate } from "react-router-dom";
import { useStore, formatINR } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";

export default function CustomerOrders() {
  const nav = useNavigate();
  const { orders, customer, createOrder, addItemToOrder } = useStore();
  const mine = orders.filter(o => o.customer_id === customer.id || o.customer_name === customer.name);

  function reorder(prevId: string) {
    const prev = orders.find(o => o.id === prevId);
    if (!prev) return;
    const o = createOrder({ source: "Customer", customerId: customer.id, customerName: customer.name });
    for (const it of prev.items) {
      for (let i = 0; i < it.quantity; i++) addItemToOrder(o.id, it.product_id, 1);
    }
    nav("/customer/menu");
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <DemoBadge />
      <header className="border-b border-border bg-card">
        <div className="container py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => nav("/customer")}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <div className="text-xs text-muted-foreground">Your orders</div>
            <h1 className="font-serif text-xl">Order history</h1>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-3">
        {mine.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <ReceiptText className="w-10 h-10 mx-auto text-muted-foreground mb-2 opacity-40" />
            <div className="font-serif text-xl">No orders yet</div>
            <div className="text-sm text-muted-foreground mb-3">Browse the menu to place your first one.</div>
            <Link to="/customer/menu"><Button>Open menu</Button></Link>
          </Card>
        ) : mine.map(o => (
          <Card key={o.id} className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-serif text-lg">{o.order_number}</span>
                  <Badge variant={o.payment_status === "paid" ? "default" : "secondary"} className="text-[10px]">
                    {o.payment_status === "paid" ? "Paid" : o.order_status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-2">{new Date(o.created_at).toLocaleString("en-IN")}</div>
                <div className="text-sm">{o.items.map(i => `${i.quantity}× ${i.product_name}`).join(" · ")}</div>
              </div>
              <div className="text-right">
                <div className="font-serif text-xl">{formatINR(o.total_amount)}</div>
                <div className="flex gap-1.5 mt-1.5">
                  {o.payment_status === "unpaid" && o.order_status === "ready" && (
                    <Button size="sm" onClick={() => nav(`/pay/${o.id}`)}>Pay</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => reorder(o.id)}>Reorder</Button>
                  <Button size="sm" variant="ghost" onClick={() => nav(`/receipt/${o.id}`)}>Receipt</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
