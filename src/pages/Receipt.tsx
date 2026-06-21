import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore, formatINR } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Printer, Mail, Download, Coffee } from "lucide-react";
import { toast } from "sonner";
import { downloadOrderBillPDF } from "@/lib/exporters";
import { DemoBadge } from "@/components/DemoBadge";

export default function Receipt() {
  const { orderId } = useParams();
  const nav = useNavigate();
  const { orders } = useStore();
  const order = orders.find(o => o.id === orderId);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState(order?.customer_email || "");

  if (!order) return <div className="p-8">Order not found.</div>;

  const handleEmail = () => {
    if (!email) return toast.error("Please enter an email");
    toast.success(`Receipt sent to ${email}`);
    setEmailOpen(false);
  };

  return (
    <div className="min-h-screen bg-secondary/40 py-8">
      <DemoBadge />
      <div className="max-w-md mx-auto">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/15 text-success mb-3 animate-pulse-ring">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl">Payment successful</h1>
          <p className="text-sm text-muted-foreground">Thank you — see you again at DineFlow.</p>
        </div>

        <Card className="p-6 shadow-elevated print:shadow-none">
          <div className="text-center border-b border-dashed border-border pb-4 mb-4">
            <div className="inline-flex items-center gap-2 mb-1">
              <Coffee className="w-5 h-5 text-primary" />
              <span className="font-serif text-2xl">DineFlow</span>
            </div>
            <div className="text-[11px] text-muted-foreground">Karpagam Branch · Coimbatore</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-4">
            <div><div className="text-muted-foreground">Order</div><div className="font-mono font-semibold">{order.order_number}</div></div>
            <div className="text-right"><div className="text-muted-foreground">Date</div><div>{new Date(order.created_at).toLocaleString("en-IN")}</div></div>
            {order.table_id && <div><div className="text-muted-foreground">Table</div><div>{order.table_id.replace("t", "")}</div></div>}
            {order.customer_name && <div className="text-right"><div className="text-muted-foreground">Customer</div><div>{order.customer_name}</div></div>}
          </div>

          <div className="border-t border-dashed border-border pt-3 space-y-1 text-sm">
            {order.items.map(i => (
              <div key={i.id} className="flex justify-between">
                <span>{i.quantity}× {i.product_name}</span>
                <span>{formatINR(i.line_total)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-border mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax (5%)</span><span>{formatINR(order.tax_amount)}</span></div>
            {order.discount_amount > 0 && <div className="flex justify-between text-accent"><span>Discount</span><span>- {formatINR(order.discount_amount)}</span></div>}
            <div className="flex justify-between font-serif text-xl pt-2 border-t border-border"><span>Total</span><span>{formatINR(order.total_amount)}</span></div>
            <div className="text-xs text-muted-foreground text-center pt-2">
              Paid via <b className="capitalize text-foreground">{order.payment_method}</b>
            </div>
          </div>

          <div className="border-t border-dashed border-border mt-4 pt-3 text-center text-[11px] text-muted-foreground">
            Thank you for dining with us · #SmartDining
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-2 mt-4 print:hidden">
          <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" /> Print</Button>
          <Button variant="outline" onClick={() => setEmailOpen(true)}><Mail className="w-4 h-4 mr-1.5" /> Email</Button>
          <Button variant="outline" onClick={() => {
            const success = downloadOrderBillPDF(order);
            if (success) {
              toast.success("Bill downloaded successfully.");
            } else {
              toast.error("Failed to download bill. Please try again.");
            }
          }}><Download className="w-4 h-4 mr-1.5" /> PDF</Button>
        </div>

        <div className="text-center mt-4 print:hidden">
          <Link to="/pos"><Button variant="ghost">← Back to POS</Button></Link>
        </div>
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Email Receipt</DialogTitle></DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Customer Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleEmail}><Mail className="w-4 h-4 mr-2" /> Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
