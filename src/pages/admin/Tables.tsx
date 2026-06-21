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
import jsPDF from "jspdf";
import { Grid3x3, Plus, QrCode, Edit, Trash2, Download } from "lucide-react";
import { useStore } from "@/lib/store";
import { dedupeByKey } from "@/lib/dedupe";
import type { Table as TableType, Floor } from "@/lib/types";
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
  const { floors, tables, upsertTable, deleteTable, upsertFloor, deleteFloor, currentCafeId } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TableType | null>(null);
  const [qr, setQr] = useState<TableType | null>(null);
  const [floorOpen, setFloorOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  const uniqueFloors = dedupeByKey(floors, (f) => `${f.cafe_id || "demo"}|${f.name}`);
  const uniqueTables = dedupeByKey(tables, (t) => `${t.cafe_id || "demo"}|${t.floor_id}|${t.table_number}`);

  const save = () => {
    if (!editing) return;
    const dup = tables.find(t => t.floor_id === editing.floor_id && t.table_number === editing.table_number && t.id !== editing.id);
    if (dup) return toast.error("This table already exists on this floor.");
    
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

  const saveFloor = () => {
    if (!editingFloor || !editingFloor.name.trim()) return toast.error("Floor name required");
    upsertFloor(editingFloor);
    setFloorOpen(false);
    toast.success("Floor saved");
  };

  const removeFloor = (id: string) => {
    if (tables.some(t => t.floor_id === id)) return toast.error("Remove tables from floor first");
    deleteFloor(id);
    toast.success("Floor removed");
  };

  const downloadAllQRs = () => {
    const pdf = new jsPDF();
    let y = 20;
    pdf.setFontSize(20);
    pdf.text("Table QR Codes", 20, y);
    y += 20;
    pdf.setFontSize(12);

    uniqueTables.forEach(t => {
      if (y > 270) { pdf.addPage(); y = 20; }
      const floorName = uniqueFloors.find(f => f.id === t.floor_id)?.name || "Unknown Floor";
      pdf.text(`${floorName} - Table ${t.table_number}`, 20, y);
      pdf.setTextColor(0, 0, 255);
      pdf.text(`${window.location.origin}/s/${t.qr_token}`, 20, y + 8);
      pdf.setTextColor(0, 0, 0);
      y += 25;
    });
    pdf.save("Table_QRs.pdf");
    toast.success("QRs downloaded");
  };

  const newFloor = (): Floor => ({ id: "f" + Math.random().toString(36).slice(2, 7), cafe_id: currentCafeId || "demo-cafe-1", name: "" });

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <PageHeader icon={Grid3x3} title="Floors & Tables" description="Manage your floor plan, table capacity and QR codes" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadAllQRs}><Download className="w-4 h-4 mr-1.5" /> Download QRs (PDF)</Button>
            <Button onClick={() => { setEditingFloor(newFloor()); setFloorOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> New Floor</Button>
          </div>
        </div>

        {uniqueFloors.map(f => {
          const tt = uniqueTables.filter(t => t.floor_id === f.id);
          return (
            <div key={f.id} className="mb-8">
              <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-2xl">{f.name}</h2>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => { setEditingFloor(f); setFloorOpen(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive/70 hover:text-destructive" onClick={() => removeFloor(f.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
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
                    <div className="flex gap-1.5 mt-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => { setEditing(t); setOpen(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setQr(t)}><QrCode className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { deleteTable(t.id); toast.success("Table deleted"); }}><Trash2 className="w-3.5 h-3.5" /></Button>
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
                    <SelectContent>{uniqueFloors.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={floorOpen} onOpenChange={setFloorOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{editingFloor?.name ? "Edit Floor" : "New Floor"}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <Label>Floor Name</Label>
              <Input placeholder="e.g. Ground Floor, Patio" value={editingFloor?.name || ""} onChange={e => editingFloor && setEditingFloor({ ...editingFloor, name: e.target.value })} />
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setFloorOpen(false)}>Cancel</Button><Button onClick={saveFloor}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!qr} onOpenChange={(o) => !o && setQr(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>QR for Table {qr?.table_number}</DialogTitle></DialogHeader>
            {qr && (
              <div className="text-center space-y-3">
                <img alt="QR" id="qr-image" className="w-56 h-56 mx-auto rounded-lg border border-border bg-white p-3"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + "/s/" + qr.qr_token)}`} crossOrigin="anonymous" />
                <div className="text-xs text-muted-foreground break-all">{window.location.origin}/s/{qr.qr_token}</div>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/s/${qr.qr_token}`); toast.success("Link copied"); }}>Copy link</Button>
                  <Button onClick={() => {
                    const link = document.createElement("a");
                    link.download = `table-qr-${qr.table_number}.png`;
                    link.href = (document.getElementById("qr-image") as HTMLImageElement).src;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("QR Code downloaded");
                  }}>Download</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
