import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, Users, Clock, Trash2 } from "lucide-react";
import { useExtraStore, type Booking } from "@/lib/extraStore";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const STATUS: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  confirmed: "bg-accent/20 text-accent",
  seated: "bg-primary/20 text-primary",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export default function Bookings() {
  const { bookings, upsertBooking, deleteBooking } = useExtraStore();
  const { tables } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const todays = bookings.filter(b => b.date === today);
  const upcoming = bookings.filter(b => b.date > today);

  const save = () => {
    if (!editing?.customer_name.trim()) return toast.error("Name required");
    upsertBooking(editing);
    toast.success("Saved");
    setOpen(false); setEditing(null);
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
        <PageHeader icon={Calendar} title="Bookings" description="Table reservations & guest list"
          actions={<Button onClick={() => { setEditing({ id: "b" + Math.random().toString(36).slice(2, 7), customer_name: "", phone: "", party_size: 2, date: today, time: "19:00", table_id: null, notes: "", status: "pending" }); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> New Booking</Button>}
        />

        <div className="grid md:grid-cols-3 gap-3 mb-6">
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Today</div><div className="font-serif text-2xl">{todays.length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Upcoming</div><div className="font-serif text-2xl">{upcoming.length}</div></Card>
          <Card className="p-3 shadow-soft"><div className="text-xs text-muted-foreground">Pending</div><div className="font-serif text-2xl text-warning">{bookings.filter(b => b.status === "pending").length}</div></Card>
        </div>

        <h2 className="font-serif text-xl mb-3">Today</h2>
        <div className="space-y-2 mb-6">
          {todays.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground border-dashed">No bookings today</Card>}
          {todays.map(b => <BookingRow key={b.id} b={b} tables={tables} onEdit={() => { setEditing(b); setOpen(true); }} onDelete={() => { deleteBooking(b.id); toast.success("Cancelled"); }} />)}
        </div>

        <h2 className="font-serif text-xl mb-3">Upcoming</h2>
        <div className="space-y-2">
          {upcoming.map(b => <BookingRow key={b.id} b={b} tables={tables} onEdit={() => { setEditing(b); setOpen(true); }} onDelete={() => { deleteBooking(b.id); toast.success("Cancelled"); }} />)}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.customer_name ? "Edit Booking" : "New Booking"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Customer name</Label><Input value={editing.customer_name} onChange={e => setEditing({ ...editing, customer_name: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></div>
                  <div><Label>Date</Label><Input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} /></div>
                  <div><Label>Time</Label><Input type="time" value={editing.time} onChange={e => setEditing({ ...editing, time: e.target.value })} /></div>
                  <div><Label>Party size</Label><Input type="number" value={editing.party_size} onChange={e => setEditing({ ...editing, party_size: +e.target.value })} /></div>
                  <div><Label>Status</Label>
                    <Select value={editing.status} onValueChange={(v: any) => setEditing({ ...editing, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["pending","confirmed","seated","cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Table</Label>
                  <Select value={editing.table_id || "none"} onValueChange={v => setEditing({ ...editing, table_id: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {tables.map(t => <SelectItem key={t.id} value={t.id}>Table {t.table_number} ({t.seats} seats)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Notes</Label><Textarea rows={2} value={editing.notes || ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function BookingRow({ b, tables, onEdit, onDelete }: any) {
  const table = tables.find((t: any) => t.id === b.table_id);
  return (
    <Card className="p-4 shadow-soft flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-secondary flex flex-col items-center justify-center">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" /><div className="text-xs font-semibold mt-0.5">{b.time}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{b.customer_name} <span className="text-xs text-muted-foreground">· {b.phone}</span></div>
        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          <Users className="w-3 h-3" /> {b.party_size}
          {table && <> · Table {table.table_number}</>}
          {b.notes && <> · {b.notes}</>}
        </div>
      </div>
      <Badge className={`${STATUS[b.status]} capitalize`}>{b.status}</Badge>
      <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
      <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="w-4 h-4 text-destructive" /></Button>
    </Card>
  );
}
