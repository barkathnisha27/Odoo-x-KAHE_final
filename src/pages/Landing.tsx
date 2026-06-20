import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, DEMO_CREDENTIALS } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Coffee, ShoppingBag, ChefHat, Sparkles, Utensils, QrCode, Brain, FlaskConical,
  Map, ArrowRight, Loader2, ShieldCheck,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";

const ROLE_REDIRECT = {
  admin: "/admin",
  cashier: "/pos",
  kitchen: "/kds",
  customer: "/customer",
} as const;

const FEATURES = [
  { icon: ShoppingBag, title: "Smart POS", desc: "Tables, cart, ETA, combos" },
  { icon: Utensils, title: "Customer Dashboard", desc: "Live tracking & loyalty" },
  { icon: Brain, title: "AI Assistant", desc: "Combos, upsells, insights" },
  { icon: ChefHat, title: "Kitchen Display", desc: "Priority queue & stations" },
  { icon: QrCode, title: "QR Self-Ordering", desc: "Scan, order, pay" },
  { icon: Sparkles, title: "Ingredient Intelligence", desc: "Live stock + restock" },
  { icon: FlaskConical, title: "Simulation Lab", desc: "Stress-test scenarios" },
  { icon: Map, title: "Map Intelligence", desc: "Demand & suppliers" },
];

export default function Landing() {
  const { user, role, signIn, signUp, demoLogin, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPw, setSignupPw] = useState("");

  useEffect(() => {
    if (!loading && user && role) nav(ROLE_REDIRECT[role]);
  }, [loading, user, role, nav]);

  async function onDemoLogin(r: keyof typeof DEMO_CREDENTIALS) {
    setBusy(r);
    const { error } = await demoLogin(r);
    setBusy(null);
    if (error) toast.error(error);
    else toast.success(`Signed in as ${r}`);
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy("login");
    const { error } = await signIn(loginEmail, loginPw);
    setBusy(null);
    if (error) toast.error(error);
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy("signup");
    const { error } = await signUp({ email: signupEmail, password: signupPw, name: signupName, role: "customer" });
    setBusy(null);
    if (error) toast.error(error);
    else toast.success("Welcome to DineFlow!");
  }

  return (
    <div className="min-h-screen gradient-hero">
      <DemoBadge />
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/60 sticky top-0 z-30">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-warm flex items-center justify-center shadow-warm">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-serif text-2xl leading-none">DineFlow</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">AI-powered POS</div>
            </div>
          </div>
          <a href="#login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in →</a>
        </div>
      </header>

      <section className="container py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5 text-terracotta" /> Hackathon demo · Fully seeded
          </div>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight mb-5 text-balance">
            Intelligent dining,
            <br />
            <span className="text-primary italic">kitchen & customer flow.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl text-balance">
            DineFlow connects customers, cashier, kitchen, inventory, suppliers, maps and analytics in one real-time system —
            predicting demand, prioritising orders, reducing waste, and giving AI insights.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-lg">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-2.5 p-3 rounded-xl glass-card">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold leading-tight">{f.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="login" className="lg:pl-8">
          <Card className="p-7 shadow-elevated border-border/60">
            <div className="text-center mb-5">
              <h2 className="font-serif text-2xl">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">Pick a demo role or use your account</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {(Object.keys(DEMO_CREDENTIALS) as Array<keyof typeof DEMO_CREDENTIALS>).map(r => {
                const Icon = r === "admin" ? ShieldCheck : r === "cashier" ? ShoppingBag : r === "kitchen" ? ChefHat : Utensils;
                return (
                  <Button
                    key={r}
                    variant="outline"
                    onClick={() => onDemoLogin(r)}
                    disabled={!!busy}
                    className="h-auto py-3 flex-col gap-1 hover:bg-secondary hover:border-primary/40"
                  >
                    {busy === r ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4 text-primary" />}
                    <span className="text-xs font-semibold capitalize">{r}</span>
                  </Button>
                );
              })}
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-card px-2 text-xs text-muted-foreground">or</span></div>
            </div>

            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <form onSubmit={onLogin} className="space-y-3">
                  <div><Label htmlFor="le">Email</Label><Input id="le" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required /></div>
                  <div><Label htmlFor="lp">Password</Label><Input id="lp" type="password" value={loginPw} onChange={e => setLoginPw(e.target.value)} required /></div>
                  <Button type="submit" className="w-full" disabled={!!busy}>
                    {busy === "login" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <form onSubmit={onSignup} className="space-y-3">
                  <div><Label htmlFor="sn">Name</Label><Input id="sn" value={signupName} onChange={e => setSignupName(e.target.value)} required /></div>
                  <div><Label htmlFor="se">Email</Label><Input id="se" type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required /></div>
                  <div><Label htmlFor="sp">Password</Label><Input id="sp" type="password" value={signupPw} onChange={e => setSignupPw(e.target.value)} required minLength={6} /></div>
                  <Button type="submit" className="w-full" disabled={!!busy}>
                    {busy === "signup" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create customer account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </section>
    </div>
  );
}
