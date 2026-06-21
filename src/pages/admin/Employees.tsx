import { useState, useEffect } from "react";
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
import { Users, Plus, Edit, Trash2, Key, Sparkles } from "lucide-react";
import { useExtraStore, type Employee } from "@/lib/extraStore";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ROLE_COLOR: Record<string, string> = {
  admin: "bg-primary text-primary-foreground",
  cashier: "bg-accent text-accent-foreground",
  kitchen: "bg-terracotta text-terracotta-foreground",
};

interface Invite {
  id: string;
  code: string;
  role: string;
  used: boolean;
  created_at: string;
}

export default function Employees() {
  const { employees, upsertEmployee, deleteEmployee } = useExtraStore();
  const { cafeId, createStaffAccount, isLocalMode } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteRole, setInviteRole] = useState<"cashier" | "kitchen">("cashier");

  const fetchInvites = async () => {
    if (!cafeId) return;
    if (isLocalMode) {
      const local = localStorage.getItem(`dineflow_invites_${cafeId}`);
      if (local) setInvites(JSON.parse(local));
      return;
    }
    try {
      const { data, error } = await supabase
        .from("cafe_invites" as never)
        .select("*")
        .eq("cafe_id", cafeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setInvites(data as Invite[]);
    } catch (e: any) {
      console.error("Error fetching invites:", e.message);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [cafeId]);

  const save = async () => {
    if (!editing?.name.trim() || !editing.email.trim()) {
      return toast.error("Name & email required");
    }

    if (isNew) {
      if (!password) {
        return toast.error("Password is required for new accounts");
      }
      if (password !== confirmPassword) {
        return toast.error("Passwords do not match");
      }

      // Check if email already exists locally in state
      if (employees.some(e => e.email.toLowerCase() === editing.email.toLowerCase())) {
        return toast.error("An account with this email already exists.");
      }

      if (!cafeId) {
        return toast.error("Cafe workspace not found. Please login again.");
      }

      try {
        const res = await createStaffAccount({
          name: editing.name,
          email: editing.email,
          role: editing.role as "cashier" | "kitchen",
          phone: editing.phone || "",
          password: password,
          is_active: editing.active
        });

        if (res?.error) {
          if (res.error.includes("schema cache") || res.error.includes("table missing") || res.error.includes("Database setup")) {
            return toast.error("Database setup incomplete. Please run migrations.");
          }
          return toast.error(res.error);
        }
      } catch (err: any) {
        return toast.error("Database setup incomplete. Please run migrations.");
      }
    }

    upsertEmployee(editing);
    toast.success(isNew ? "Staff account created successfully." : "Saved");
    setOpen(false);
    setEditing(null);
  };

  const handleGenerateInvite = async () => {
    if (!cafeId) return toast.error("No cafe workspace linked");
    const code = `${inviteRole.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    
    if (isLocalMode) {
      const newInv = { id: Math.random().toString(), code, role: inviteRole, used: false, created_at: new Date().toISOString() };
      const current = [...invites, newInv];
      localStorage.setItem(`dineflow_invites_${cafeId}`, JSON.stringify(current));
      setInvites(current);
      return toast.success(`Invite generated (Local): ${code}`);
    }

    try {
      const { error } = await supabase.from("cafe_invites" as never).insert({
        cafe_id: cafeId,
        code,
        role: inviteRole,
        used: false,
      } as never);
      if (error) throw error;
      toast.success(`Invite generated: ${code}`);
      fetchInvites();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate invite");
    }
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8">
        <PageHeader icon={Users} title="Employees" description="Manage staff accounts, roles and permissions"
          actions={<Button onClick={() => { setEditing({ id: "e" + Math.random().toString(36).slice(2, 7), name: "", email: "", role: "cashier", active: true, hired_at: new Date().toISOString().slice(0, 10) }); setIsNew(true); setPassword(""); setConfirmPassword(""); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> New Employee</Button>}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Total</div><div className="font-serif text-2xl">{employees.length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Active</div><div className="font-serif text-2xl text-accent">{employees.filter(e => e.active).length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Cashiers</div><div className="font-serif text-2xl">{employees.filter(e => e.role === "cashier").length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Kitchen</div><div className="font-serif text-2xl">{employees.filter(e => e.role === "kitchen").length}</div></Card>
        </div>

        <Card className="shadow-soft overflow-x-auto">
          <div className="p-4 border-b border-border font-serif text-lg">Active Team Members</div>
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
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setIsNew(false); setOpen(true); }}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { deleteEmployee(e.id); toast.success("Removed"); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </T>
        </Card>

        {/* Staff Invites / Team Access Section */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-5 shadow-soft space-y-4 h-fit col-span-1">
            <div className="flex items-center gap-2 font-serif text-lg text-primary">
              <Key className="w-5 h-5" />
              <span>Generate Staff Invite</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Create a unique signup invitation code for cashier or kitchen staff to join this workspace.
            </p>
            <div className="space-y-2">
              <Label>Target Staff Role</Label>
              <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateInvite} className="w-full flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Generate Code
            </Button>
          </Card>

          <Card className="shadow-soft col-span-2 overflow-x-auto">
            <div className="p-4 border-b border-border font-serif text-lg flex items-center justify-between">
              <span>Pending & Used Invites</span>
              <Badge variant="outline">{invites.length} Codes</Badge>
            </div>
            <T>
              <TableHeader>
                <TableRow>
                  <TableHead>Invite Code</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">
                      No staff invites generated yet. Use the panel on the left to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  invites.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono font-bold text-sm text-primary">{inv.code}</TableCell>
                      <TableCell>
                        <Badge className={`${ROLE_COLOR[inv.role]} text-xs capitalize`}>{inv.role}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={inv.used ? "secondary" : "default"} className={inv.used ? "" : "bg-accent"}>
                          {inv.used ? "Used" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </T>
          </Card>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{isNew ? "New Employee Account" : `Edit ${editing?.name}`}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={editing.email} disabled={!isNew} onChange={e => setEditing({ ...editing, email: e.target.value })} /></div>
                
                {isNew && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Password</Label>
                      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div>
                      <Label>Confirm Password</Label>
                      <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Role</Label>
                    <Select value={editing.role} onValueChange={(v: any) => setEditing({ ...editing, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Phone</Label><Input value={editing.phone || ""} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></div>
                </div>
                <div className="flex items-center justify-between"><Label>Active Status</Label><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Create Staff Account</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

