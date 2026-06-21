import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { Role } from "./types";
import { useStore } from "@/lib/store";
import { seedDemoCustomer } from "@/lib/seed";
import { toast } from "sonner";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: Role | null;
  cafeId: string | null;
  isGuest?: boolean;
  loading: boolean;
  isLocalMode: boolean;
  signIn: (email: string, password: string, selectedRole: Role) => Promise<{ error?: string }>;
  signUp: (input: { email: string; password: string; name: string; role?: Role; phone?: string; dietary_preferences?: string[]; cafe_id?: string }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  demoLogin: (role: Role) => Promise<{ error?: string }>;
  guestSignIn: (name?: string) => Promise<void>;
  registerCafe: (cafeInfo: { cafeName: string; ownerName: string; email: string; password: string; phone: string; address: string; city: string; upiId?: string }) => Promise<{ cafeId?: string; error?: string }>;
  registerStaff: (input: { name: string; email: string; password: string; inviteCode: string }) => Promise<{ error?: string }>;
  createStaffAccount: (input: { name: string; email: string; role: "cashier" | "kitchen"; phone: string; password?: string; is_active?: boolean }) => Promise<{ error?: string }>;
}

const Ctx = createContext<AuthCtx | null>(null);

const DEMO_ACCOUNTS: Record<Exclude<Role, "guest">, { email: string; password: string; name: string }> = {
  admin: { email: "admin@dineflow.ai", password: "admin123", name: "Nisha (Owner)" },
  cashier: { email: "cashier@dineflow.ai", password: "cashier123", name: "Shareng (Cashier)" },
  kitchen: { email: "kitchen@dineflow.ai", password: "kitchen123", name: "Kitchen Team" },
  customer: { email: "customer@dineflow.ai", password: "customer123", name: "Aisha" },
};

const LOCAL_USERS_KEY = "dineflow_local_users";
const LOCAL_CAFES_KEY = "dineflow_local_cafes";

interface LocalUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  phone?: string;
  cafe_id: string;
  is_active: boolean;
}

interface LocalCafe {
  id: string;
  cafe_name: string;
  owner_name: string;
  owner_email: string;
  phone: string;
  address: string;
  city: string;
  upi_id?: string;
}

const initialLocalUsers: LocalUser[] = [
  { id: "u-admin", name: "Nisha Admin", email: "admin@dineflow.ai", password: "admin123", role: "admin", phone: "9876543210", cafe_id: "demo-cafe-1", is_active: true },
  { id: "u-cashier", name: "Shareng Cashier", email: "cashier@dineflow.ai", password: "cashier123", role: "cashier", phone: "9876543211", cafe_id: "demo-cafe-1", is_active: true },
  { id: "u-kitchen", name: "Kitchen Team", email: "kitchen@dineflow.ai", password: "kitchen123", role: "kitchen", phone: "9876543212", cafe_id: "demo-cafe-1", is_active: true },
  { id: "u-customer", name: "Aisha Customer", email: "customer@dineflow.ai", password: "customer123", role: "customer", phone: "9876543213", cafe_id: "demo-cafe-1", is_active: true },
];

const initialLocalCafes: LocalCafe[] = [
  { id: "demo-cafe-1", cafe_name: "DineFlow Demo Cafe", owner_name: "Nisha", owner_email: "admin@dineflow.ai", phone: "9876543210", address: "Karpagam College Area, Coimbatore", city: "Coimbatore", upi_id: "dineflow@ybl" }
];

function getLocalUsers(): LocalUser[] {
  const data = localStorage.getItem(LOCAL_USERS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(initialLocalUsers));
    return initialLocalUsers;
  }
  return JSON.parse(data);
}

function saveLocalUsers(users: LocalUser[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function getLocalCafes(): LocalCafe[] {
  const data = localStorage.getItem(LOCAL_CAFES_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_CAFES_KEY, JSON.stringify(initialLocalCafes));
    return initialLocalCafes;
  }
  return JSON.parse(data);
}

function saveLocalCafes(cafes: LocalCafe[]) {
  localStorage.setItem(LOCAL_CAFES_KEY, JSON.stringify(cafes));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [cafeId, setCafeIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    const checkDbMode = async (): Promise<boolean> => {
      try {
        const { error } = await supabase.from("cafes" as any).select("id").limit(1);
        if (error && (error.code === "PGRST116" || error.code === "42P01" || error.message?.includes("schema cache") || error.message?.includes("does not exist"))) {
          return true;
        } else if (error) {
          return true;
        } else {
          return false;
        }
      } catch (e) {
        return true;
      }
    };

    const initAuth = async () => {
      setLoading(true);
      const localMode = await checkDbMode();
      setIsLocalMode(localMode);

      if (localMode) {
        const activeLocal = localStorage.getItem("dineflow_active_local_user");
        const g = localStorage.getItem("dineflow_guest");
        if (g) {
          try {
            const parsed = JSON.parse(g);
            setRole("guest");
            setCafeIdState("demo-cafe-1");
            useStore.getState().setCurrentCafeId("demo-cafe-1");
            useStore.setState({ customer: { ...useStore.getState().customer, id: parsed.id ?? "guest", name: parsed.name ?? "Guest Customer", email: "", phone: "" } });
          } catch (err) {}
        } else if (activeLocal) {
          try {
            const u = JSON.parse(activeLocal) as LocalUser;
            setRole(u.role);
            setCafeIdState(u.cafe_id);
            useStore.getState().setCurrentCafeId(u.cafe_id);
            setUser({ id: u.id, email: u.email } as any);
          } catch (err) {}
        } else {
          setRole(null);
          setCafeIdState(null);
          setUser(null);
        }
        setLoading(false);
      } else {
        try {
          const { data: { session: sess } } = await supabase.auth.getSession();
          setSession(sess);
          setUser(sess?.user ?? null);
          
          if (sess?.user) {
            const uId = sess.user.id;
            const { data: roleData } = await supabase.from("user_roles" as never).select("role").eq("user_id", uId).limit(1).maybeSingle();
            const { data: profileData } = await supabase.from("profiles" as never).select("cafe_id").eq("id", uId).limit(1).maybeSingle();
            const r = (roleData as { role: Role } | null)?.role ?? null;
            const cid = (profileData as { cafe_id: string } | null)?.cafe_id ?? "demo-cafe-1";
            
            setRole(r);
            setCafeIdState(cid);
            useStore.getState().setCurrentCafeId(cid);

            if (r === "customer") {
              const { data } = await supabase.from("profiles" as never).select("*").eq("id", uId).limit(1).maybeSingle();
              const prof = data as any | null;
              if (prof) {
                useStore.setState({ customer: {
                  id: prof.id,
                  cafe_id: prof.cafe_id ?? "demo-cafe-1",
                  name: prof.name ?? "Guest Customer",
                  email: prof.email ?? "",
                  phone: prof.phone ?? "",
                  loyalty_points: prof.loyalty_points ?? 0,
                  tier: prof.tier ?? "Bronze",
                  dietary_preferences: prof.dietary_preferences ?? [],
                  favorite_items: [],
                  total_spent: prof.total_spent ?? 0,
                  total_orders: prof.total_orders ?? 0,
                } });
              }
            }
          } else {
            const g = localStorage.getItem("dineflow_guest");
            const activeLocal = localStorage.getItem("dineflow_active_local_user");
            if (g) {
              try {
                const parsed = JSON.parse(g);
                setRole("guest");
                setCafeIdState("demo-cafe-1");
                useStore.getState().setCurrentCafeId("demo-cafe-1");
                useStore.setState({ customer: { ...useStore.getState().customer, id: parsed.id ?? "guest", name: parsed.name ?? "Guest Customer", email: "", phone: "" } });
              } catch (err) {}
            } else if (activeLocal) {
              try {
                const u = JSON.parse(activeLocal) as LocalUser;
                setRole(u.role);
                setCafeIdState(u.cafe_id);
                useStore.getState().setCurrentCafeId(u.cafe_id);
                setUser({ id: u.id, email: u.email } as any);
              } catch (err) {}
            } else {
              setRole(null);
              setCafeIdState(null);
            }
          }
        } catch (e) {
          // ignore
        } finally {
          setLoading(false);
        }
      }

      return localMode;
    };

    // initAuth is async, so we set up the Supabase auth listener after it resolves
    // to know whether we're in local mode or not.
    let unsubscribe = () => {};

    initAuth().then((resolvedLocalMode) => {
      // Only subscribe to Supabase auth events when NOT in local mode.
      // In local mode, Supabase always fires SIGNED_OUT which would interfere
      // with our localStorage-based session.
      if (!resolvedLocalMode) {
        const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
          setSession(sess);
          setUser(sess?.user ?? null);
          if (sess?.user) {
            initAuth();
          } else {
            // Supabase signed out — check for local fallbacks
            const g = localStorage.getItem("dineflow_guest");
            const activeLocal = localStorage.getItem("dineflow_active_local_user");
            if (g) {
              try {
                const parsed = JSON.parse(g);
                setRole("guest");
                setCafeIdState("demo-cafe-1");
                useStore.getState().setCurrentCafeId("demo-cafe-1");
                useStore.setState({ customer: { ...useStore.getState().customer, id: parsed.id ?? "guest", name: parsed.name ?? "Guest Customer", email: "", phone: "" } });
              } catch (err) {}
            } else if (activeLocal) {
              try {
                const u = JSON.parse(activeLocal) as LocalUser;
                setRole(u.role);
                setCafeIdState(u.cafe_id);
                useStore.getState().setCurrentCafeId(u.cafe_id);
                setUser({ id: u.id, email: u.email } as any);
              } catch (err) {}
            } else {
              setRole(null);
              setCafeIdState(null);
            }
          }
        });
        unsubscribe = () => sub.subscription.unsubscribe();
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn: AuthCtx["signIn"] = async (email, password, selectedRole) => {
    const users = getLocalUsers();
    const matchedLocal = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (matchedLocal) {
      if (matchedLocal.password !== password) {
        return { error: "Invalid email, password, or role." };
      }
      if (matchedLocal.role !== selectedRole) {
        return { error: "Selected role does not match this account." };
      }
      if (!matchedLocal.is_active) {
        return { error: "This account is archived. Contact admin." };
      }
      
      localStorage.setItem("dineflow_active_local_user", JSON.stringify(matchedLocal));
      setRole(matchedLocal.role);
      setCafeIdState(matchedLocal.cafe_id);
      useStore.getState().setCurrentCafeId(matchedLocal.cafe_id);
      setUser({ id: matchedLocal.id, email: matchedLocal.email } as any);
      toast.success("Successfully logged in (Local Mode)");
      return {};
    }

    if (isLocalMode) {
      return { error: "Invalid email, password, or role." };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: "Invalid email, password, or role." };
      if (data?.user) {
        const { role: fetchedRole, cafeId: fetchedCafeId } = await fetchProfile(data.user.id);
        if (fetchedRole !== selectedRole) {
          await _signOut();
          return { error: "Selected role does not match this account." };
        }
        const resolvedCafeId = fetchedCafeId || "demo-cafe-1";
        setCafeIdState(resolvedCafeId);
        useStore.getState().setCurrentCafeId(resolvedCafeId);
      }
      return {};
    } catch (e) {
      return { error: "Database setup incomplete. Please run migrations." };
    }
  };

  const signUp: AuthCtx["signUp"] = async ({ email, password, name, role = "customer", phone, dietary_preferences, cafe_id }) => {
    const users = getLocalUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { error: "An account with this email already exists." };
    }
    const newId = `u-${Math.random().toString(36).slice(2, 8)}`;
    const newLocalUser: LocalUser = {
      id: newId,
      name,
      email,
      password,
      role,
      phone,
      cafe_id: cafe_id || "demo-cafe-1",
      is_active: true,
    };
    users.push(newLocalUser);
    saveLocalUsers(users);

    if (isLocalMode) {
      return {};
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name, role, phone, dietary_preferences, cafe_id },
        },
      });
      return error ? { error: error.message } : {};
    } catch (e) {
      return {}; 
    }
  };

  const registerCafe: AuthCtx["registerCafe"] = async ({ cafeName, ownerName, email, password, phone, address, city, upiId }) => {
    const newCafeId = `cafe-${Math.random().toString(36).slice(2, 8)}`;
    
    const cafes = getLocalCafes();
    cafes.push({
      id: newCafeId,
      cafe_name: cafeName,
      owner_name: ownerName,
      owner_email: email,
      phone,
      address,
      city,
      upi_id: upiId,
    });
    saveLocalCafes(cafes);

    await signUp({
      email,
      password,
      name: ownerName,
      role: "admin",
      phone,
      cafe_id: newCafeId,
    });

    useStore.getState().initializeNewCafe(newCafeId);
    useStore.getState().setCurrentCafeId(newCafeId);

    if (isLocalMode) {
      const localUsers = getLocalUsers();
      const createdUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (createdUser) {
        localStorage.setItem("dineflow_active_local_user", JSON.stringify(createdUser));
        setRole("admin");
        setCafeIdState(newCafeId);
        setUser({ id: createdUser.id, email: createdUser.email } as any);
      }
      return { cafeId: newCafeId };
    }

    try {
      const { error: dbError } = await supabase.from("cafes" as never).insert({
        id: newCafeId,
        cafe_name: cafeName,
        owner_name: ownerName,
        owner_email: email,
        phone,
        address,
        city,
        upi_id: upiId,
      } as never);

      if (dbError) {
        console.warn("Supabase insert cafes failed, falling back locally:", dbError.message);
      }
    } catch (e) {
      console.warn("Supabase database error during cafe registration.");
    }

    return { cafeId: newCafeId };
  };

  const registerStaff: AuthCtx["registerStaff"] = async ({ name, email, password, inviteCode }) => {
    if (isLocalMode) {
      const roleStr = inviteCode.toLowerCase().startsWith("kitchen") ? "kitchen" : "cashier";
      const signUpResult = await signUp({
        email,
        password,
        name,
        role: roleStr as Role,
        cafe_id: cafeId || "demo-cafe-1",
      });
      return signUpResult;
    }

    try {
      const { data: invite, error: inviteErr } = await supabase
        .from("cafe_invites" as never)
        .select("*")
        .eq("code", inviteCode)
        .eq("used", false)
        .limit(1)
        .maybeSingle();

      if (inviteErr) return { error: "Failed to validate invite code." };
      if (!invite) return { error: "Invalid or already used invite code." };

      const inviteData = invite as { cafe_id: string; role: Role };

      const signUpResult = await signUp({
        email,
        password,
        name,
        role: inviteData.role,
        cafe_id: inviteData.cafe_id,
      });

      if (signUpResult.error) return signUpResult;

      await supabase.from("cafe_invites" as never).update({ used: true } as never).eq("code", inviteCode);
      
      useStore.getState().initializeNewCafe(inviteData.cafe_id);
      useStore.getState().setCurrentCafeId(inviteData.cafe_id);

      return {};
    } catch (e) {
      return { error: "Database setup incomplete. Please run migrations." };
    }
  };

  const createStaffAccount = async (input: { name: string; email: string; role: "cashier" | "kitchen"; phone: string; password?: string; is_active?: boolean }) => {
    if (!cafeId) return { error: "Cafe workspace not found. Please login again." };
    
    const users = getLocalUsers();
    if (users.some(u => u.email.toLowerCase() === input.email.toLowerCase())) {
      return { error: "An account with this email already exists." };
    }

    const pass = input.password || `${input.role}123`;
    const newId = `u-${Math.random().toString(36).slice(2, 8)}`;
    const newStaff: LocalUser = {
      id: newId,
      name: input.name,
      email: input.email,
      password: pass,
      role: input.role,
      phone: input.phone,
      cafe_id: cafeId,
      is_active: input.is_active ?? true,
    };
    
    users.push(newStaff);
    saveLocalUsers(users);

    if (!isLocalMode) {
      try {
        const { error } = await supabase.from("profiles" as never).insert({
          id: newId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          cafe_id: cafeId,
        } as never);
        if (error) console.warn("Could not insert staff profile to Supabase:", error.message);
      } catch (e) {
        console.warn("Supabase profiles table not reachable.");
      }
    }

    return {};
  };

  async function _signOut() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("dineflow_guest");
    localStorage.removeItem("dineflow_active_local_user");
    setUser(null);
    setSession(null);
    setRole(null);
    setCafeIdState(null);
    // Reset store to clean demo state on sign out
    useStore.getState().resetDemo();
  }

  const guestSignIn: AuthCtx["guestSignIn"] = async (name) => {
    const id = `guest-${Math.random().toString(36).slice(2, 8)}`;
    const guest = { id, name: name?.trim() || "Guest Customer", email: "", phone: "" };
    localStorage.setItem("dineflow_guest", JSON.stringify(guest));
    setRole("guest");
    setCafeIdState("demo-cafe-1");
    useStore.getState().setCurrentCafeId("demo-cafe-1");
    useStore.setState({ customer: { ...useStore.getState().customer, id: guest.id, cafe_id: "demo-cafe-1", name: guest.name, email: "", phone: "" } });
  };

  const demoLogin: AuthCtx["demoLogin"] = async (r) => {
    const users = getLocalUsers();
    const acc = DEMO_ACCOUNTS[r];
    const localUser = users.find(u => u.email.toLowerCase() === acc.email.toLowerCase());
    if (localUser) {
      localStorage.setItem("dineflow_active_local_user", JSON.stringify(localUser));
      setRole(localUser.role);
      setCafeIdState(localUser.cafe_id);
      useStore.getState().setCurrentCafeId(localUser.cafe_id);
      setUser({ id: localUser.id, email: localUser.email } as any);
      toast.success(`Demo Logged in as ${r}`);
      return {};
    }

    if (isLocalMode) {
      return { error: "Demo account not seeded locally." };
    }

    try {
      let { error } = await supabase.auth.signInWithPassword({ email: acc.email, password: acc.password });
      if (error && /invalid/i.test(error.message)) {
        const up = await signUp({ email: acc.email, password: acc.password, name: acc.name, role: r, cafe_id: "demo-cafe-1" });
        if (up.error) return { error: up.error };
        const retry = await supabase.auth.signInWithPassword({ email: acc.email, password: acc.password });
        error = retry.error;
      }
      return error ? { error: error.message } : {};
    } catch (e) {
      return { error: "Database setup incomplete. Please run migrations." };
    }
  };

  async function fetchProfile(userId: string): Promise<{ role: Role | null; cafeId: string | null }> {
    try {
      const { data: roleData } = await supabase.from("user_roles" as never).select("role").eq("user_id", userId).limit(1).maybeSingle();
      const { data: profileData } = await supabase.from("profiles" as never).select("cafe_id").eq("id", userId).limit(1).maybeSingle();
      return {
        role: (roleData as { role: Role } | null)?.role ?? null,
        cafeId: (profileData as { cafe_id: string } | null)?.cafe_id ?? null,
      };
    } catch (e) {
      return { role: null, cafeId: null };
    }
  }

  return (
    <Ctx.Provider value={{ user, session, role, cafeId, loading, isLocalMode, signIn, signUp, signOut: _signOut, demoLogin, guestSignIn, registerCafe, registerStaff, createStaffAccount }}>
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
