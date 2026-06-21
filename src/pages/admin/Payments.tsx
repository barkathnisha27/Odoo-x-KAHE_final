import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DemoBadge } from "@/components/DemoBadge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, Smartphone, QrCode } from "lucide-react";
import { useStore } from "@/lib/store";
import { dedupeByKey } from "@/lib/dedupe";
import { toast } from "sonner";

const ICONS: Record<string, any> = { cash: Banknote, card: CreditCard, upi: Smartphone };

export default function Payments() {
  const { paymentMethods, togglePaymentMethod, setUpiId } = useStore();
  const uniqueMethods = dedupeByKey(paymentMethods, (p) => `${p.cafe_id || "demo"}|${p.id}`);

  return (
    <AppShell>
      <DemoBadge />
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <PageHeader icon={CreditCard} title="Payment Methods" description="Enable or disable how customers can pay" />

        <div className="space-y-3">
          {uniqueMethods.map(p => {
            const Icon = ICONS[p.id];
            return (
              <Card key={p.id} className="p-4 shadow-soft">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-2">{p.name} {p.enabled && <Badge className="bg-accent text-accent-foreground text-[10px]">Enabled</Badge>}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.id === "cash" && "Open cash drawer & manual entry"}
                      {p.id === "card" && "External terminal / digital wallets"}
                      {p.id === "upi" && "Show dynamic UPI QR for instant pay"}
                    </div>
                  </div>
                  <Switch checked={p.enabled} onCheckedChange={() => { togglePaymentMethod(p.id); toast.success("Updated"); }} />
                </div>
                {p.id === "upi" && p.enabled && (
                  <div className="mt-4 pt-4 border-t border-border flex items-end gap-3">
                    <div className="flex-1">
                      <Label className="flex items-center gap-1"><QrCode className="w-3.5 h-3.5" /> UPI ID</Label>
                      <Input value={p.upi_id || ""} onChange={e => setUpiId(e.target.value)} placeholder="merchant@bank" />
                    </div>
                    <img alt="QR" className="w-20 h-20 rounded-lg border border-border bg-white p-1"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=${encodeURIComponent(p.upi_id || "")}&pn=DineFlow`} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
