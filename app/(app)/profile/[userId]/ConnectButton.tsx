"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, UserX, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface ConnectButtonProps {
  targetUserId: string;
  initialStatus: string | null;
}

export default function ConnectButton({ targetUserId, initialStatus }: ConnectButtonProps) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: targetUserId }),
      });
      
      if (res.ok) {
        setStatus("PENDING");
        toast.add({ title: "Connection request sent!", type: "success" });
      } else {
        const err = await res.text();
        toast.add({ title: "Action failed", description: err, type: "error" });
      }
    } catch {
      toast.add({ title: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (status === "ACCEPTED") {
    return (
      <Button variant="secondary" disabled className="gap-2">
        <Check className="h-4 w-4" /> Connected
      </Button>
    );
  }

  if (status === "PENDING") {
    return (
      <Button variant="outline" disabled className="gap-2 text-muted-foreground">
        <Check className="h-4 w-4" /> Request Pending
      </Button>
    );
  }

  if (status === "REJECTED") {
    return (
      <Button variant="outline" disabled className="gap-2 text-muted-foreground">
        <UserX className="h-4 w-4" /> Declined
      </Button>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
      Connect
    </Button>
  );
}
