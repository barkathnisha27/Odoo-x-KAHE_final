import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table as T, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ChefHat, Plus, Edit, AlertTriangle, FileText, FileSpreadsheet } from "lucide-react";
import { useStore, formatINR } from "@/lib/store";
import type { Ingredient } from "@/lib/types";
import { dedupeByKey } from "@/lib/dedupe";
import { toast } from "sonner";
import { exportToPDF, exportToXLSX } from "@/lib/exporters";

export default function Ingredients() {
  const { ingredients, recipes, products } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);

  const uniqueIngredients = dedupeByKey(ingredients, (i) => `${i.cafe_id || "demo"}|${i.name}`);

  const save = () => {
    if (!editing?.name.trim()) return toast.error("Name required");
    
    const dup = ingredients.find(i => i.name.toLowerCase() === editing.name.trim().toLowerCase() && i.id !== editing.id);
    if (dup) return toast.error("This ingredient already exists.");

    useStore.setState(s => {
      const exists = s.ingredients.find(i => i.id === editing.id);
      return { ingredients: exists ? s.ingredients.map(i => i.id === editing.id ? editing : i) : [...s.ingredients, editing] };
    });
    toast.success("Saved");
    setOpen(false); setEditing(null);
  };

  const handlePDF = () => {
    try {
      exportToPDF("dineflow_ingredient_stock_report", "Ingredient Stock Report", [
        {
          heading: "Ingredients",
          columns: ["Ingredient", "Category", "Current Stock", "Min Level", "Used Today", "Cost", "Supplier"],
          rows: uniqueIngredients.map(i => [
            i.name, i.category, `${i.current_stock} ${i.unit}`, `${i.min_stock_level} ${i.unit}`,
            `${i.used_today} ${i.unit}`, formatINR(i.cost_per_unit), i.supplier_name
          ])
        }
      ]);
      toast.success("Report downloaded successfully.");
    } catch (e) {
      toast.error("Failed to download report. Please try again.");
    }
  };

  const handleXLSX = () => {
    try {
      exportToXLSX("dineflow_ingredient_stock_report", [
        {
          name: "Ingredients",
          rows: uniqueIngredients.map(i => ({
            Ingredient: i.name,
            Category: i.category,
            "Current Stock": `${i.current_stock} ${i.unit}`,
            "Min Level": `${i.min_stock_level} ${i.unit}`,
            "Used Today": `${i.used_today} ${i.unit}`,
            Cost: i.cost_per_unit,
            Supplier: i.supplier_name
          }))
        }
      ]);
      toast.success("Report downloaded successfully.");
    } catch (e) {
      toast.error("Failed to download report. Please try again.");
    }
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader icon={ChefHat} title="Ingredients & Recipes" description="Live stock, recipes, and supplier intelligence"
          actions={
            <>
              <Button variant="outline" onClick={handlePDF}><FileText className="w-4 h-4 mr-1.5" /> Export PDF</Button>
              <Button variant="outline" onClick={handleXLSX}><FileSpreadsheet className="w-4 h-4 mr-1.5" /> Export Excel</Button>
              <Button onClick={() => { setEditing({ id: "i" + Math.random().toString(36).slice(2, 7), name: "", unit: "g", current_stock: 1000, min_stock_level: 200, cost_per_unit: 1, supplier_name: "", category: "Dry", used_today: 0 }); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> New Ingredient</Button>
            </>
          }
        />

        <div className="grid md:grid-cols-4 gap-3 mb-6">
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Total Ingredients</div><div className="font-serif text-2xl">{uniqueIngredients.length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Low Stock</div><div className="font-serif text-2xl text-warning">{uniqueIngredients.filter(i => i.current_stock < i.min_stock_level * 2).length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Critical</div><div className="font-serif text-2xl text-destructive">{uniqueIngredients.filter(i => i.current_stock < i.min_stock_level).length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Suppliers</div><div className="font-serif text-2xl">{new Set(uniqueIngredients.map(i => i.supplier_name)).size}</div></Card>
        </div>

        <Card className="shadow-soft overflow-x-auto">
          <T>
            <TableHeader><TableRow><TableHead>Ingredient</TableHead><TableHead>Stock Level</TableHead><TableHead>Used Today</TableHead><TableHead>Cost</TableHead><TableHead>Supplier</TableHead><TableHead>Used in</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {uniqueIngredients.map(i => {
                const usedIn = recipes.filter(r => r.ingredient_id === i.id).map(r => products.find(p => p.id === r.product_id)?.name).filter(Boolean);
                const pct = Math.min(100, (i.current_stock / (i.min_stock_level * 3)) * 100);
                const critical = i.current_stock < i.min_stock_level;
                return (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-1.5">{critical && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />} {i.name}</div>
                      <div className="text-xs text-muted-foreground">{i.category}</div>
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <div className="text-xs mb-1">{i.current_stock} {i.unit} · min {i.min_stock_level}</div>
                      <Progress value={pct} className={`h-1.5 ${critical ? "[&>div]:bg-destructive" : ""}`} />
                    </TableCell>
                    <TableCell>{i.used_today} {i.unit}</TableCell>
                    <TableCell>{formatINR(i.cost_per_unit)}/{i.unit}</TableCell>
                    <TableCell className="text-sm">{i.supplier_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{usedIn.join(", ") || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(i); setOpen(true); }}><Edit className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </T>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.name ? `Edit ${editing.name}` : "New Ingredient"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Unit</Label><Input value={editing.unit} onChange={e => setEditing({ ...editing, unit: e.target.value })} /></div>
                <div><Label>Category</Label><Input value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} /></div>
                <div><Label>Current stock</Label><Input type="number" value={editing.current_stock} onChange={e => setEditing({ ...editing, current_stock: +e.target.value })} /></div>
                <div><Label>Min stock level</Label><Input type="number" value={editing.min_stock_level} onChange={e => setEditing({ ...editing, min_stock_level: +e.target.value })} /></div>
                <div><Label>Cost / unit (₹)</Label><Input type="number" step="0.01" value={editing.cost_per_unit} onChange={e => setEditing({ ...editing, cost_per_unit: +e.target.value })} /></div>
                <div className="col-span-2"><Label>Supplier</Label><Input value={editing.supplier_name} onChange={e => setEditing({ ...editing, supplier_name: e.target.value })} /></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
