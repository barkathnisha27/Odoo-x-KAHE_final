import { useParams, useNavigate } from "react-router-dom";
import { useStore, formatINR } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ChefHat, Utensils, ShoppingBag, Coffee } from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";

const STAGES = [
  { key: 0, label: "Order received", icon: ShoppingBag },
  { key: 1, label: "Sent to kitchen", icon: ChefHat },
  { key: 2, label: "Preparing", icon: Utensils },
  { key: 3, label: "Ready", icon: CheckCircle2 },
];

export default function CustomerDisplay() {
  const { orderId } = useParams();
  const { orders } = useStore();
  const order = orders.find(o => o.id === orderId);

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/50">
      <Card className="p-8 text-center"><Coffee className="w-12 h-12 mx-auto text-muted-foreground mb-3" /> No order on display.</Card>
    </div>
  );

  const stage = order.payment_status === "paid" ? 4
    : order.order_status === "ready" ? 3
    : order.kitchen_status === "preparing" ? 2
    : order.order_status === "sent_to_kitchen" ? 1 : 0;

  return (
    <div className="min-h-screen gradient-hero p-6 lg:p-12 flex flex-col">
      <DemoBadge />
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shadow-warm">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-3xl">DineFlow</span>
        </div>
        <div className="text-sm uppercase tracking-widest text-muted-foreground">Customer Display</div>
      </div>

      {order.payment_status === "paid" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-success/15 text-success flex items-center justify-center mb-4 animate-pulse-ring">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="font-serif text-5xl mb-2">Thank you!</h1>
          <p className="text-lg text-muted-foreground">Your payment was successful.</p>
          <p className="text-sm text-muted-foreground mt-1">{order.order_number} · {formatINR(order.total_amount)}</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8 flex-1">
          <Card className="p-8 shadow-elevated">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Your order</div>
            <div className="font-serif text-4xl mt-1 mb-6">{order.order_number}</div>
            <div className="space-y-3 text-lg">
              {order.items.map(i => (
                <div key={i.id} className="flex justify-between border-b border-border/50 pb-2">
                  <span>{i.quantity}× {i.product_name}</span>
                  <span className="font-serif">{formatINR(i.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-1 text-base">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatINR(order.tax_amount)}</span></div>
              {order.discount_amount > 0 && <div className="flex justify-between text-accent"><span>Discount</span><span>- {formatINR(order.discount_amount)}</span></div>}
              <div className="flex justify-between font-serif text-3xl pt-3 border-t border-border mt-3">
                <span>Total</span><span>{formatINR(order.total_amount)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-8 shadow-elevated flex flex-col">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Order status</div>
            <div className="font-serif text-2xl mt-1 mb-8">Live tracking</div>
            <div className="space-y-5 flex-1">
              {STAGES.map((s, i) => {
                const done = i <= stage;
                const active = i === stage;
                const Icon = s.icon;
                return (
                  <div key={s.key} className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${done ? "bg-accent text-accent-foreground shadow-elevated" : "bg-muted text-muted-foreground"} ${active ? "animate-pulse-ring scale-110" : ""}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className={`font-serif text-2xl ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
                      {active && <div className="text-sm text-accent font-medium">In progress…</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            {order.eta_minutes > 0 && stage < 3 && (
              <div className="mt-6 p-4 rounded-xl bg-secondary text-center">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Estimated time</div>
                <div className="font-serif text-4xl">{order.eta_minutes} <span className="text-lg">min</span></div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
