import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface StaffSignupProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function StaffSignup({ onSuccess, onCancel }: StaffSignupProps) {
  const { registerStaff } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await registerStaff({
        name,
        email,
        password,
        inviteCode,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success("Joined restaurant team successfully!");
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="staffName">Full Name</Label>
        <Input id="staffName" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Alex Johnson" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="staffEmail">Email Address</Label>
        <Input id="staffEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="alex@cafe.com" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="staffPassword">Password</Label>
        <Input id="staffPassword" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="inviteCode">Staff Invite Code</Label>
        <Input id="inviteCode" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required placeholder="e.g. CASH-XYZ123" />
        <p className="text-[11px] text-muted-foreground">Ask your restaurant administrator to generate a Cashier or Kitchen invite code.</p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Team"}
        </Button>
      </div>
    </form>
  );
}
