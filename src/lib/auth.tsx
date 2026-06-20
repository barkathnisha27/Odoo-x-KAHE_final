import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { Role } from "./types";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (input: { email: string; password: string; name: string; role?: Role; phone?: string; dietary_preferences?: string[] }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  demoLogin: (role: Role) => Promise<{ error?: string }>;
}

const Ctx = createContext<AuthCtx | null>(null);

const DEMO_ACCOUNTS: Record<Role, { email: string; password: string; name: string }> = {
  admin: { email: "admin@dineflow.ai", password: "admin123", name: "Nisha (Owner)" },
  cashier: { email: "cashier@dineflow.ai", password: "cashier123", name: "Shareng (Cashier)" },
  kitchen: { email: "kitchen@dineflow.ai", password: "kitchen123", name: "Kitchen Team" },
  customer: { email: "customer@dineflow.ai", password: "customer123", name: "Aisha" },
};

async function fetchRole(userId: string): Promise<Role | null> {
  const { data } = await supabase.from("user_roles" as never).select("role").eq("user_id", userId).limit(1).maybeSingle();
  return (data as { role: Role } | null)?.role ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => { fetchRole(sess.user.id).then(setRole); }, 0);
      } else {
        setRole(null);
      }
    });
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) fetchRole(sess.user.id).then(setRole).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signUp: AuthCtx["signUp"] = async ({ email, password, name, role = "customer", phone, dietary_preferences }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name, role, phone, dietary_preferences },
      },
    });
    return error ? { error: error.message } : {};
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const demoLogin: AuthCtx["demoLogin"] = async (r) => {
    const acc = DEMO_ACCOUNTS[r];
    let { error } = await supabase.auth.signInWithPassword({ email: acc.email, password: acc.password });
    if (error && /invalid/i.test(error.message)) {
      // Create the demo account on first use
      const up = await signUp({ email: acc.email, password: acc.password, name: acc.name, role: r });
      if (up.error) return { error: up.error };
      const retry = await supabase.auth.signInWithPassword({ email: acc.email, password: acc.password });
      error = retry.error;
    }
    return error ? { error: error.message } : {};
  };

  return (
    <Ctx.Provider value={{ user, session, role, loading, signIn, signUp, signOut, demoLogin }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const DEMO_CREDENTIALS = DEMO_ACCOUNTS;
