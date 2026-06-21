import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AdminSignupProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminSignup({ onSuccess, onCancel }: AdminSignupProps) {
  const { registerCafe } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cafeName, setCafeName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [upiId, setUpiId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await registerCafe({
        cafeName,
        ownerName,
        email,
        password,
        phone,
        address,
        city,
        upiId: upiId || undefined,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success("Restaurant account created successfully!");
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cafeName">Restaurant/Cafe Name</Label>
          <Input id="cafeName" value={cafeName} onChange={e => setCafeName(e.target.value)} required placeholder="e.g. Mocha Cafe" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ownerName">Owner Name</Label>
          <Input id="ownerName" value={ownerName} onChange={e => setOwnerName(e.target.value)} required placeholder="e.g. John Doe" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="owner@cafe.com" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="e.g. 9876543210" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={e => setCity(e.target.value)} required placeholder="e.g. Bangalore" />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="address">Address</Label>
        <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required placeholder="e.g. 123 Main Street" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="upiId">UPI ID (for Customer Payments, optional)</Label>
        <Input id="upiId" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g. merchant@upi" />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register Restaurant"}
        </Button>
      </div>
    </form>
  );
}
