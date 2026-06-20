import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore, formatINR } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Banknote, CreditCard, QrCode, CheckCircle2, ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { DemoBadge } from "@/components/DemoBadge";

export default function Payment() {
  const { orderId } = useParams();
  const nav = useNavigate();
  const { orders, paymentMethods, payOrder } = useStore();
  const order = orders.find(o => o.id === orderId);
  const [cash, setCash] = useState("");
  const [txRef, setTxRef] = useState("");

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">Order not found. <Button variant="link" onClick={() => nav(-1)}>Back</Button></Card>
      </div>
    );
  }

  const upi = paymentMethods.find(p => p.id === "upi");
  const upiLink = `upi://pay?pa=${upi?.upi_id ?? "dineflow@ybl"}&pn=DineFlow&am=${order.total_amount}&cu=INR&tn=${order.order_number}`;

  function done(method: "cash" | "upi" | "card") {
    if (method === "cash") {
      const received = parseFloat(cash);
      if (isNaN(received) || received < order!.total_amount) { toast.error("Insufficient cash"); return; }
    }
    if (method === "card" && !txRef.trim()) { toast.error("Enter transaction reference"); return; }
    payOrder(order!.id, method, method === "cash" ? parseFloat(cash) : undefined);
    toast.success("Payment successful · Receipt ready");
    nav(`/receipt/${order!.id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <DemoBadge />
      <header className="border-b border-border bg-card">
        <div className="container py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => nav(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <div className="text-xs text-muted-foreground">Checkout</div>
            <div className="font-serif text-xl">{order.order_number}</div>
          </div>
        </div>
      </header>

      <div className="container py-6 grid lg:grid-cols-[1fr_400px] gap-6">
        <Card className="p-6 shadow-soft">
          <h2 className="font-serif text-2xl mb-4">Payment method</h2>
          <Tabs defaultValue={paymentMethods.find(p => p.enabled)?.id ?? "cash"}>
            <TabsList className="grid grid-cols-3 w-full">
              {paymentMethods.filter(p => p.enabled).map(p => (
                <TabsTrigger key={p.id} value={p.id}>
                  {p.id === "cash" && <Banknote className="w-4 h-4 mr-1.5" />}
                  {p.id === "upi" && <QrCode className="w-4 h-4 mr-1.5" />}
                  {p.id === "card" && <CreditCard className="w-4 h-4 mr-1.5" />}
                  {p.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="cash" className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Amount received</label>
                <Input type="number" value={cash} onChange={e => setCash(e.target.value)} className="text-2xl h-14 font-serif mt-1" placeholder="0" />
              </div>
              {cash && parseFloat(cash) >= order.total_amount && (
                <div className="p-4 rounded-lg bg-accent/10 text-accent">
                  <div className="text-xs uppercase tracking-wider">Change due</div>
                  <div className="font-serif text-3xl">{formatINR(parseFloat(cash) - order.total_amount)}</div>
                </div>
              )}
              <Button size="lg" className="w-full" onClick={() => done("cash")}>Confirm cash payment</Button>
            </TabsContent>
            <TabsContent value="upi" className="mt-5 text-center space-y-4">
              <div className="inline-block p-4 rounded-2xl bg-white shadow-elevated">
                <QRCodeSVG value={upiLink} size={200} bgColor="#ffffff" fgColor="#3d2817" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pay to</div>
                <div className="font-mono text-lg">{upi?.upi_id}</div>
                <div className="font-serif text-3xl mt-2">{formatINR(order.total_amount)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => nav(-1)}>Cancel</Button>
                <Button onClick={() => done("upi")}><CheckCircle2 className="w-4 h-4 mr-1" /> Confirmed</Button>
              </div>
            </TabsContent>
            <TabsContent value="card" className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Transaction reference</label>
                <Input value={txRef} onChange={e => setTxRef(e.target.value)} className="mt-1" placeholder="TXN-..." />
              </div>
              <Button size="lg" className="w-full" onClick={() => done("card")}>Confirm card payment</Button>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-5 shadow-soft h-fit">
          <h3 className="font-serif text-xl mb-3">Order summary</h3>
          <div className="space-y-1.5 text-sm pb-3 border-b border-border">
            {order.items.map(i => (
              <div key={i.id} className="flex justify-between">
                <span>{i.quantity}× {i.product_name}</span>
                <span>{formatINR(i.line_total)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-sm pt-3">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatINR(order.tax_amount)}</span></div>
            {order.discount_amount > 0 && <div className="flex justify-between text-accent"><span>Discount</span><span>- {formatINR(order.discount_amount)}</span></div>}
            <div className="flex justify-between text-lg font-serif pt-2 border-t border-border"><span>Total</span><span>{formatINR(order.total_amount)}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
