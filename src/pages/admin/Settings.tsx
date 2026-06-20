import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Settings as SettingsIcon, RefreshCw, Database, Sparkles, Coffee, LogOut } from "lucide-react";
import { useStore } from "@/lib/store";
import { useExtraStore } from "@/lib/extraStore";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Settings() {
  const { resetDemo, products, orders, ingredients } = useStore();
  const { resetExtra, employees, bookings } = useExtraStore();
  const { signOut, user } = useAuth();
  const nav = useNavigate();

  const handleReset = () => {
    resetDemo();
    resetExtra();
    toast.success("Demo data reset — all operational state cleared and re-seeded", { duration: 4000 });
  };

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <PageHeader icon={SettingsIcon} title="Settings" description="Demo configuration and data management" />

        <Card className="p-6 shadow-soft mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Coffee className="w-5 h-5" /></div>
            <div>
              <div className="font-semibold">Restaurant Profile</div>
              <div className="text-sm text-muted-foreground">DineFlow Cafe · Coimbatore</div>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><div className="text-xs text-muted-foreground">Currency</div><div className="font-medium">INR (₹)</div></div>
            <div><div className="text-xs text-muted-foreground">Tax</div><div className="font-medium">5% GST</div></div>
            <div><div className="text-xs text-muted-foreground">Timezone</div><div className="font-medium">Asia/Kolkata</div></div>
            <div><div className="text-xs text-muted-foreground">Plan</div><div className="font-medium"><Badge className="bg-accent">Demo</Badge></div></div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center"><Database className="w-5 h-5" /></div>
            <div>
              <div className="font-semibold">Demo Data Snapshot</div>
              <div className="text-sm text-muted-foreground">Current in-memory state</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="Products" value={products.length} />
            <Stat label="Orders" value={orders.length} />
            <Stat label="Ingredients" value={ingredients.length} />
            <Stat label="Employees" value={employees.length} />
            <Stat label="Bookings" value={bookings.length} />
          </div>
        </Card>

        <Card className="p-6 shadow-soft mb-4 border-terracotta/30 bg-gradient-to-br from-terracotta/5 to-card">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-terracotta/15 text-terracotta flex items-center justify-center"><RefreshCw className="w-5 h-5" /></div>
            <div className="flex-1">
              <div className="font-semibold">Reset Demo Data</div>
              <div className="text-sm text-muted-foreground">Clears all orders, table states, stock movement, employees and bookings. Re-seeds the full demo catalogue.</div>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><RefreshCw className="w-4 h-4 mr-1.5" /> Reset everything</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all live orders, stock movement, table assignments, employee changes and bookings, and restore the original seed data. Your auth account stays.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Yes, reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Sparkles className="w-5 h-5" /></div>
            <div className="flex-1">
              <div className="font-semibold">AI & Account</div>
              <div className="text-sm text-muted-foreground">Signed in as {user?.email}</div>
            </div>
          </div>
          <Button variant="outline" onClick={async () => { await signOut(); toast.success("Signed out"); nav("/"); }}>
            <LogOut className="w-4 h-4 mr-1.5" /> Sign out
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-lg bg-secondary/40">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-serif text-2xl">{value}</div>
    </div>
  );
}
