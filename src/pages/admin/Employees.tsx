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
import { Table as T, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Edit, Trash2 } from "lucide-react";
import { useExtraStore, type Employee } from "@/lib/extraStore";
import { toast } from "sonner";

const ROLE_COLOR: Record<string, string> = {
  admin: "bg-primary text-primary-foreground",
  cashier: "bg-accent text-accent-foreground",
  kitchen: "bg-terracotta text-terracotta-foreground",
};

export default function Employees() {
  const { employees, upsertEmployee, deleteEmployee } = useExtraStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const save = () => {
    if (!editing?.name.trim() || !editing.email.trim()) return toast.error("Name & email required");
    upsertEmployee(editing);
    toast.success("Saved");
    setOpen(false); setEditing(null);
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
        <PageHeader icon={Users} title="Employees" description="Manage staff accounts, roles and permissions"
          actions={<Button onClick={() => { setEditing({ id: "e" + Math.random().toString(36).slice(2, 7), name: "", email: "", role: "cashier", active: true, hired_at: new Date().toISOString().slice(0, 10) }); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> New Employee</Button>}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Total</div><div className="font-serif text-2xl">{employees.length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Active</div><div className="font-serif text-2xl text-accent">{employees.filter(e => e.active).length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Cashiers</div><div className="font-serif text-2xl">{employees.filter(e => e.role === "cashier").length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Kitchen</div><div className="font-serif text-2xl">{employees.filter(e => e.role === "kitchen").length}</div></Card>
        </div>

        <Card className="shadow-soft overflow-x-auto">
          <T>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Role</TableHead><TableHead>Phone</TableHead><TableHead>Hired</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {employees.map(e => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9"><AvatarFallback>{e.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-medium">{e.name}</div>
                        <div className="text-xs text-muted-foreground">{e.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge className={`${ROLE_COLOR[e.role]} text-xs capitalize`}>{e.role}</Badge></TableCell>
                  <TableCell className="text-sm">{e.phone || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.hired_at}</TableCell>
                  <TableCell><Badge variant={e.active ? "default" : "secondary"} className={e.active ? "bg-accent" : ""}>{e.active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setOpen(true); }}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { deleteEmployee(e.id); toast.success("Removed"); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </T>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.name ? `Edit ${editing.name}` : "New Employee"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Role</Label>
                    <Select value={editing.role} onValueChange={(v: any) => setEditing({ ...editing, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Phone</Label><Input value={editing.phone || ""} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></div>
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
