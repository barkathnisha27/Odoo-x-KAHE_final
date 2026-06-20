import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Grid3x3, Plus, QrCode, Edit } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Table as TableType } from "@/lib/types";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
  available: "bg-success/15 text-success",
  ordering: "bg-blue-500/15 text-blue-600",
  kitchen: "bg-warning/20 text-warning",
  preparing: "bg-warning/20 text-warning",
  ready: "bg-purple-500/15 text-purple-600",
  payment: "bg-destructive/15 text-destructive",
  paid: "bg-muted text-muted-foreground",
};

export default function Tables() {
  const { floors, tables, upsertTable } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TableType | null>(null);
  const [qr, setQr] = useState<TableType | null>(null);

  const save = () => {
    if (!editing) return;
    upsertTable(editing);
    toast.success("Saved");
    setOpen(false); setEditing(null);
  };

  const newTable = (floorId: string): TableType => ({
    id: "t" + Math.random().toString(36).slice(2, 7),
    floor_id: floorId,
    table_number: tables.filter(t => t.floor_id === floorId).length + 1,
    seats: 4,
    active: true,
    status: "available",
    qr_token: "tbl-" + Math.random().toString(36).slice(2, 10),
    current_order_id: null,
  });

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <PageHeader icon={Grid3x3} title="Floors & Tables" description="Manage your floor plan, table capacity and QR codes" />

        {floors.map(f => {
          const tt = tables.filter(t => t.floor_id === f.id);
          return (
            <div key={f.id} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-2xl">{f.name}</h2>
                <Button size="sm" variant="outline" onClick={() => { setEditing(newTable(f.id)); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Add table</Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {tt.map(t => (
                  <Card key={t.id} className="p-4 shadow-soft hover:shadow-elevated transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-serif text-2xl">T{t.table_number}</div>
                      <Badge className={`text-[10px] ${STATUS_COLOR[t.status]}`}>{t.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">{t.seats} seats</div>
                    <div className="flex gap-1.5">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(t); setOpen(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setQr(t)}><QrCode className="w-3.5 h-3.5" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Table T{editing?.table_number}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Table #</Label><Input type="number" value={editing.table_number} onChange={e => setEditing({ ...editing, table_number: +e.target.value })} /></div>
                  <div><Label>Seats</Label><Input type="number" value={editing.seats} onChange={e => setEditing({ ...editing, seats: +e.target.value })} /></div>
                </div>
                <div><Label>Floor</Label>
                  <Select value={editing.floor_id} onValueChange={v => setEditing({ ...editing, floor_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{floors.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!qr} onOpenChange={(o) => !o && setQr(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>QR for Table {qr?.table_number}</DialogTitle></DialogHeader>
            {qr && (
              <div className="text-center space-y-3">
                <img alt="QR" className="w-56 h-56 mx-auto rounded-lg border border-border bg-white p-3"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + "/s/" + qr.qr_token)}`} />
                <div className="text-xs text-muted-foreground break-all">{window.location.origin}/s/{qr.qr_token}</div>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/s/${qr.qr_token}`); toast.success("Link copied"); }}>Copy link</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
