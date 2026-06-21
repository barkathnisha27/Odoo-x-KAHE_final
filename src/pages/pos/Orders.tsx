import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { useStore, formatINR } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ReceiptText, ArrowRight, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DemoBadge } from "@/components/DemoBadge";

export default function POSOrders() {
  const nav = useNavigate();
  const { orders } = useStore();
  const [q, setQ] = useState("");

  const deleteOrder = (id: string) => {
    useStore.setState(s => ({ orders: s.orders.filter(o => o.id !== id) }));
    toast.success("Order deleted");
  };

  const list = orders.filter(o =>
    q === "" || o.id.toLowerCase().includes(q.toLowerCase()) ||
    o.order_number.toLowerCase().includes(q.toLowerCase()) ||
    (o.customer_name && o.customer_name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl">Orders</h1>
            <p className="text-sm text-muted-foreground">All orders this session</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by # or customer" value={q} onChange={e => setQ(e.target.value)} className="pl-9 w-64" />
          </div>
        </div>

        {list.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <ReceiptText className="w-10 h-10 mx-auto text-muted-foreground mb-2 opacity-50" />
            <div className="font-serif text-xl">No orders yet</div>
            <div className="text-sm text-muted-foreground mb-3">Start one from the POS.</div>
            <Link to="/pos"><Button>Open POS</Button></Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {list.map(o => (
              <Card key={o.id} className="p-4 hover:shadow-elevated transition-shadow flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-serif text-lg">{o.order_number}</span>
                    <Badge variant={o.payment_status === "paid" ? "default" : o.order_status === "draft" ? "outline" : "secondary"} className="text-[10px]">
                      {o.payment_status === "paid" ? "Paid" : o.order_status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{o.source}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("en-IN")} · {o.items.length} items
                    {o.customer_name && <> · {o.customer_name}</>}
                    {o.table_id && <> · Table {o.table_id.replace("t", "")}</>}
                  </div>
                </div>
                <div className="font-serif text-xl">{formatINR(o.total_amount)}</div>
                <div className="flex gap-2">
                  {o.payment_status !== "paid" && (
                    <>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => nav("/pos", { state: { orderId: o.id, tableId: o.table_id } })}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => deleteOrder(o.id)}><Trash2 className="w-4 h-4" /></Button>
                    </>
                  )}
                  {o.payment_status !== "paid" && o.items.length > 0 ? (
                    <Button size="sm" variant="outline" onClick={() => nav(`/pay/${o.id}`)}>Pay <ArrowRight className="w-3 h-3 ml-1" /></Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => nav(`/receipt/${o.id}`)}>Receipt</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
