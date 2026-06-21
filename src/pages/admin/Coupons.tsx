import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tag, Plus, Edit, Trash2, Copy } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Coupon } from "@/lib/types";
import { toast } from "sonner";

export default function Coupons() {
  const { coupons, upsertCoupon } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const remove = (id: string) => { useStore.setState(s => ({ coupons: s.coupons.filter(c => c.id !== id) })); toast.success("Deleted"); };
  const save = () => {
    if (!editing?.code.trim()) return toast.error("Code required");
    upsertCoupon({ ...editing, code: editing.code.toUpperCase() });
    toast.success("Saved");
    setOpen(false); setEditing(null);
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <PageHeader icon={Tag} title="Coupons & Promotions" description="Create discount codes and promo offers"
          actions={<Button onClick={() => { setEditing({ id: "co" + Math.random().toString(36).slice(2, 7), cafe_id: useStore.getState().currentCafeId || "demo-cafe-1", code: "", discount_type: "percentage", discount_value: 10, active: true, promo_type: "coupon" }); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> New Promo</Button>}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {coupons.map(c => (
            <Card key={c.id} className="p-4 shadow-soft hover:shadow-elevated transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="font-serif text-2xl tracking-wider">{c.code}</div>
                <Badge variant={c.active ? "default" : "secondary"} className={c.active ? "bg-accent" : ""}>{c.active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                {c.discount_type === "percentage" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                {c.promo_type === "auto_order" && <div className="text-xs text-accent mt-1">Auto: Min order ₹{c.min_order_amount}</div>}
                {c.promo_type === "auto_product" && <div className="text-xs text-accent mt-1">Auto: Min qty {c.min_quantity}</div>}
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(c); setOpen(true); }}><Edit className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied"); }}><Copy className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.code ? "Edit Coupon" : "New Coupon"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div><Label>Code</Label><Input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="SAVE20" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Promo Type</Label>
                    <Select value={editing.promo_type || "coupon"} onValueChange={(v: any) => setEditing({ ...editing, promo_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coupon">Coupon Code</SelectItem>
                        <SelectItem value="auto_order">Auto (Order Amount)</SelectItem>
                        <SelectItem value="auto_product">Auto (Item Qty)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Discount Type</Label>
                    <Select value={editing.discount_type} onValueChange={(v: any) => setEditing({ ...editing, discount_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Discount Value</Label><Input type="number" value={editing.discount_value} onChange={e => setEditing({ ...editing, discount_value: +e.target.value })} /></div>
                  {editing.promo_type === "auto_order" && <div><Label>Min Order Amount (₹)</Label><Input type="number" value={editing.min_order_amount || 0} onChange={e => setEditing({ ...editing, min_order_amount: +e.target.value })} /></div>}
                  {editing.promo_type === "auto_product" && <div><Label>Min Item Qty</Label><Input type="number" value={editing.min_quantity || 0} onChange={e => setEditing({ ...editing, min_quantity: +e.target.value })} /></div>}
                </div>
                <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
