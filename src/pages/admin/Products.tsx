import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table as T, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Edit, Trash2, Search } from "lucide-react";
import { useStore, formatINR } from "@/lib/store";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

const empty = (): Product => ({
  id: "p" + Math.random().toString(36).slice(2, 8),
  name: "", category_id: "c1", price: 100, unit: "piece", tax_percentage: 5, prep_time_minutes: 5,
  station: "Beverage Counter", stock_qty: 20, sold_today: 0, margin_percentage: 50,
  is_kitchen_item: true, is_available: true, is_popular: false, dietary_tags: ["veg"], description: "",
});

export default function Products() {
  const { products, categories, deleteProduct, upsertProduct } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [q, setQ] = useState("");

  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Name required");
    upsertProduct(editing);
    toast.success("Product saved");
    setOpen(false); setEditing(null);
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader icon={Package} title="Products" description="Manage menu items, prices, stock and recipes"
          actions={<Button onClick={() => { setEditing(empty()); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> New Product</Button>}
        />

        <Card className="p-4 shadow-soft mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" className="pl-9" />
          </div>
        </Card>

        <Card className="shadow-soft overflow-x-auto">
          <T>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead>
                <TableHead>Station</TableHead><TableHead>Stock</TableHead><TableHead>Sold</TableHead>
                <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => {
                const cat = categories.find(c => c.id === p.category_id);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.name} {p.is_popular && <Badge variant="secondary" className="ml-1 text-[10px]">🔥</Badge>}</div>
                      <div className="text-xs text-muted-foreground">{p.prep_time_minutes} min · {p.unit}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{cat?.name}</Badge></TableCell>
                    <TableCell className="font-semibold">{formatINR(p.price)}</TableCell>
                    <TableCell className="text-sm">{p.station}</TableCell>
                    <TableCell><span className={p.stock_qty < 10 ? "text-destructive font-semibold" : ""}>{p.stock_qty}</span></TableCell>
                    <TableCell>{p.sold_today}</TableCell>
                    <TableCell><Badge variant={p.is_available ? "default" : "secondary"} className={p.is_available ? "bg-accent" : ""}>{p.is_available ? "Available" : "Off"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { deleteProduct(p.id); toast.success("Deleted"); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </T>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.name ? `Edit ${editing.name}` : "New Product"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Category</Label>
                  <Select value={editing.category_id} onValueChange={v => setEditing({ ...editing, category_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Station</Label>
                  <Select value={editing.station} onValueChange={v => setEditing({ ...editing, station: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Beverage Counter","Hot Kitchen","Snacks Counter","Dessert Counter"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Price (₹)</Label><Input type="number" value={editing.price} onChange={e => setEditing({ ...editing, price: +e.target.value })} /></div>
                <div><Label>Unit</Label><Input value={editing.unit} onChange={e => setEditing({ ...editing, unit: e.target.value })} /></div>
                <div><Label>Prep time (min)</Label><Input type="number" value={editing.prep_time_minutes} onChange={e => setEditing({ ...editing, prep_time_minutes: +e.target.value })} /></div>
                <div><Label>Stock qty</Label><Input type="number" value={editing.stock_qty} onChange={e => setEditing({ ...editing, stock_qty: +e.target.value })} /></div>
                <div><Label>Tax %</Label><Input type="number" value={editing.tax_percentage} onChange={e => setEditing({ ...editing, tax_percentage: +e.target.value })} /></div>
                <div><Label>Margin %</Label><Input type="number" value={editing.margin_percentage} onChange={e => setEditing({ ...editing, margin_percentage: +e.target.value })} /></div>
                <div className="col-span-2"><Label>Description</Label><Textarea rows={2} value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
                <div className="col-span-2"><Label>Dietary tags (comma-separated)</Label><Input value={editing.dietary_tags.join(", ")} onChange={e => setEditing({ ...editing, dietary_tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} /></div>
                <div className="flex items-center justify-between col-span-1"><Label>Available</Label><Switch checked={editing.is_available} onCheckedChange={v => setEditing({ ...editing, is_available: v })} /></div>
                <div className="flex items-center justify-between col-span-1"><Label>Popular</Label><Switch checked={editing.is_popular} onCheckedChange={v => setEditing({ ...editing, is_popular: v })} /></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
