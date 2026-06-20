import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, Gift, Star } from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";

export default function CustomerRewards() {
  const nav = useNavigate();
  const { customer } = useStore();
  const next = customer.loyalty_points >= 250 ? 500 : customer.loyalty_points >= 100 ? 250 : 100;
  const pct = (customer.loyalty_points / next) * 100;

  const rewards = [
    { pts: 100, label: "₹20 off your next order", got: customer.loyalty_points >= 100 },
    { pts: 250, label: "₹50 off + free dessert", got: customer.loyalty_points >= 250 },
    { pts: 500, label: "Gold tier — priority service", got: customer.loyalty_points >= 500 },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <DemoBadge />
      <header className="border-b border-border bg-card">
        <div className="container py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => nav("/customer")}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="font-serif text-xl">Rewards</h1>
        </div>
      </header>

      <div className="container py-6 space-y-5">
        <Card className="p-6 shadow-elevated gradient-warm text-white">
          <div className="flex items-center gap-2 mb-1"><Award className="w-5 h-5" /> {customer.tier} member</div>
          <div className="font-serif text-5xl">{customer.loyalty_points}<span className="text-lg opacity-80"> points</span></div>
          <div className="text-sm opacity-90 mt-1">{next - customer.loyalty_points} pts to next reward</div>
          <Progress value={pct} className="mt-3 h-2 bg-white/20" />
        </Card>

        <div className="space-y-3">
          <h2 className="font-serif text-xl">Available rewards</h2>
          {rewards.map(r => (
            <Card key={r.pts} className={`p-4 flex items-center gap-3 ${r.got ? "border-accent/40" : ""}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${r.got ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                <Gift className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.pts} pts required</div>
              </div>
              <Button size="sm" disabled={!r.got} variant={r.got ? "default" : "outline"}>{r.got ? "Redeem" : "Locked"}</Button>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="font-serif text-xl mb-3">Personalised offers</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { code: "COFFEE10", label: "Coffee Lover", desc: "10% off any Coffee" },
              { code: "STUDENT", label: "Student Combo", desc: "Burger + Fries + Cold Coffee" },
              { code: "QUICK", label: "Quick Bite", desc: "₹50 off snacks above ₹200" },
            ].map(o => (
              <Card key={o.code} className="p-4">
                <Badge variant="secondary" className="mb-2"><Star className="w-3 h-3 mr-1" /> {o.code}</Badge>
                <div className="font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
