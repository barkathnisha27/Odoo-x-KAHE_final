import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, DEMO_CREDENTIALS } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Coffee, ShoppingBag, ChefHat, Sparkles, Utensils, QrCode, Brain, FlaskConical,
  Map, ArrowRight, Loader2,
} from "lucide-react";
import { DemoBadge } from "@/components/DemoBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminSignup } from "@/components/auth/AdminSignup";
import { StaffSignup } from "@/components/auth/StaffSignup";

const ROLE_REDIRECT = {
  admin: "/pos",
  cashier: "/pos",
  kitchen: "/kds",
  customer: "/customer",
  guest: "/customer",
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
  const { user, role, signIn, signUp, loading, guestSignIn, isLocalMode } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [view, setView] = useState<"login" | "customer-signup" | "admin-signup" | "staff-signup">("login");
  
  const [loginRole, setLoginRole] = useState<"admin" | "cashier" | "kitchen" | "customer">("customer");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPw, setSignupPw] = useState("");
  
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    if (!loading && user && role) nav(ROLE_REDIRECT[role]);
  }, [loading, user, role, nav]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy("login");
    const { error } = await signIn(loginEmail, loginPw, loginRole);
    setBusy(null);
    if (error) toast.error(error);
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy("signup");
    const { error } = await signUp({ email: signupEmail, password: signupPw, name: signupName, role: "customer" });
    setBusy(null);
    if (error) toast.error(error);
    else {
      toast.success("Welcome to DineFlow! Log in to access your dashboard.");
      setView("login");
    }
  }

  async function onGuest(e?: React.FormEvent) {
    if (e) e.preventDefault();
    await guestSignIn(guestName || undefined);
    nav(ROLE_REDIRECT["customer"]);
  }

  return (
    <div className="min-h-screen gradient-hero">
      <DemoBadge />
      {isLocalMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs text-center py-2 px-4 flex items-center justify-center gap-2 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span><strong>Local Demo Mode Active:</strong> Supabase database migrations not fully applied. Accounts and cafe workspace data will persist in local browser storage.</span>
        </div>
      )}
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
          <button onClick={() => setView("login")} className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in →</button>
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
            {view === "login" && (
              <>
                <div className="text-center mb-5">
                  <h2 className="font-serif text-2xl">Welcome back</h2>
                  <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
                </div>
                <form onSubmit={onLogin} className="space-y-3">
                  <div>
                    <Label>Role</Label>
                    <Select value={loginRole} onValueChange={(v: any) => setLoginRole(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin / Owner</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="le">Email</Label>
                    <Input id="le" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required placeholder="email@address.com" />
                  </div>
                  <div>
                    <Label htmlFor="lp">Password</Label>
                    <Input id="lp" type="password" value={loginPw} onChange={e => setLoginPw(e.target.value)} required placeholder="••••••••" />
                  </div>
                  <Button type="submit" className="w-full" disabled={!!busy}>
                    {busy === "login" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </form>

                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <button onClick={() => setView("customer-signup")} className="hover:text-primary transition-colors">Create Customer Account</button>
                    <button onClick={() => setView("admin-signup")} className="hover:text-primary transition-colors font-medium">Create Cafe Account (Admin)</button>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    <button onClick={() => setView("staff-signup")} className="hover:text-primary transition-colors">Join Cafe Team (Staff)</button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">Or continue as guest</div>
                  <div className="flex gap-2">
                    <Input placeholder="Your name (optional)" value={guestName} onChange={e => setGuestName(e.target.value)} />
                    <Button onClick={onGuest}>Continue as Guest</Button>
                  </div>
                </div>
              </>
            )}

            {view === "customer-signup" && (
              <>
                <div className="text-center mb-5">
                  <h2 className="font-serif text-2xl">Create Customer Account</h2>
                  <p className="text-sm text-muted-foreground mt-1">Register to track loyalty and view dietary suggestions</p>
                </div>
                <form onSubmit={onSignup} className="space-y-3">
                  <div>
                    <Label htmlFor="sn">Name</Label>
                    <Input id="sn" value={signupName} onChange={e => setSignupName(e.target.value)} required placeholder="Alex" />
                  </div>
                  <div>
                    <Label htmlFor="se">Email</Label>
                    <Input id="se" type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required placeholder="alex@gmail.com" />
                  </div>
                  <div>
                    <Label htmlFor="sp">Password</Label>
                    <Input id="sp" type="password" value={signupPw} onChange={e => setSignupPw(e.target.value)} required minLength={6} placeholder="••••••••" />
                  </div>
                  <Button type="submit" className="w-full" disabled={!!busy}>
                    {busy === "signup" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register"}
                  </Button>
                </form>
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  <button onClick={() => setView("login")} className="hover:text-primary transition-colors">Already have an account? Sign in</button>
                </div>
              </>
            )}

            {view === "admin-signup" && (
              <>
                <div className="text-center mb-5">
                  <h2 className="font-serif text-2xl">Create Restaurant Account</h2>
                  <p className="text-sm text-muted-foreground mt-1">Establish a new workspace for your staff and menu</p>
                </div>
                <AdminSignup onSuccess={() => setView("login")} onCancel={() => setView("login")} />
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  <button onClick={() => setView("login")} className="hover:text-primary transition-colors">Already have an account? Sign in</button>
                </div>
              </>
            )}

            {view === "staff-signup" && (
              <>
                <div className="text-center mb-5">
                  <h2 className="font-serif text-2xl">Join Restaurant Team</h2>
                  <p className="text-sm text-muted-foreground mt-1">Enter your invitation code to create a Cashier or Kitchen profile</p>
                </div>
                <StaffSignup onSuccess={() => setView("login")} onCancel={() => setView("login")} />
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  <button onClick={() => setView("login")} className="hover:text-primary transition-colors">Already have an account? Sign in</button>
                </div>
              </>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}

