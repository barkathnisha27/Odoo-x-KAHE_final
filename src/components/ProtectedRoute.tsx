import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children, allow }: { children: ReactNode; allow?: Role[] }) {
  const { user, role, loading, isLocalMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // In local mode: session is tracked by role (no real Supabase user object needed)
  // In Supabase mode: require a real user object OR guest role
  const isAuthenticated = isLocalMode ? (role !== null) : (user !== null || role === "guest");

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If route requires specific roles, ensure role is present and allowed
  if (allow) {
    if (!role) {
      return <Navigate to="/" replace />;
    }
    if (!allow.includes(role)) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
}
