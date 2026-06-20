import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tag, Plus, Edit, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Category } from "@/lib/types";
import { toast } from "sonner";

const COLORS = ["#c2956b", "#e8a87c", "#c4654a", "#9b72cf", "#7d9b76", "#5b8bb2", "#d4af37", "#a8556b"];

export default function Categories() {
  const { categories, products, upsertCategory } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const remove = (id: string) => {
    if (products.some(p => p.category_id === id)) return toast.error("Move products before deleting");
    useStore.setState(s => ({ categories: s.categories.filter(c => c.id !== id) }));
    toast.success("Deleted");
  };

  const save = () => {
    if (!editing?.name.trim()) return toast.error("Name required");
    upsertCategory(editing);
    setOpen(false); setEditing(null);
    toast.success("Saved");
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <PageHeader icon={Tag} title="Categories" description="Organise products into menu categories"
          actions={<Button onClick={() => { setEditing({ id: "cat" + Math.random().toString(36).slice(2, 7), name: "", color: COLORS[0], icon: "Coffee" }); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> New Category</Button>}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(c => {
            const count = products.filter(p => p.category_id === c.id).length;
            return (
              <Card key={c.id} className="p-4 shadow-soft hover:shadow-elevated transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: c.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{count} items</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(c); setOpen(true); }}><Edit className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </Card>
            );
          })}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.name ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Color</Label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setEditing({ ...editing, color: c })}
                        className={`w-8 h-8 rounded-lg ${editing.color === c ? "ring-2 ring-offset-2 ring-foreground" : ""}`} style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
