import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export default function AccessDenied() {
  const nav = useNavigate();
  const { role, signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="p-8 max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground mb-6">Access denied for this role.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { if (role === "admin") nav("/admin"); else if (role === "cashier") nav("/pos"); else if (role === "kitchen") nav("/kds"); else nav("/"); }}>Go to your dashboard</Button>
          <Button variant="outline" onClick={async () => { await signOut(); nav("/"); }}>Logout</Button>
        </div>
      </Card>
    </div>
  );
}
