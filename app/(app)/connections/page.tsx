"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { Loader2, UserCheck, Clock, Users, UserX } from "lucide-react";
import Link from "next/link";

interface ConnectionUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  profile?: { college: string | null; branch: string | null } | null;
}

interface Connection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  requester: ConnectionUser;
  receiver: ConnectionUser;
}

export default function ConnectionsPage() {
  const { user, isLoaded } = useUser();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    fetch("/api/connections")
      .then((r) => (r.ok ? r.json() : []))
      .then(setConnections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isLoaded]);

  // Current Clerk user's DB representation comes from the JWT sub matching clerkId
  // The connections API returns the DB user id in requester/receiver.id
  // We find our DB user id by checking which user in each connection matches our clerkId
  // Since we don't have clerkId on the connection payload, we identify ourselves by
  // checking which side appears most as the common participant across all connections.
  // A simpler reliable approach: fetch /api/profile to get our DB id.
  const [myDbId, setMyDbId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.id) setMyDbId(data.id); })
      .catch(console.error);
  }, [isLoaded, user]);

  const respond = async (requesterId: string, action: "ACCEPTED" | "REJECTED") => {
    setRespondingId(requesterId);
    try {
      const res = await fetch("/api/connections/respond", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId, status: action }),
      });
      if (res.ok) {
        setConnections((prev) =>
          prev.map((c) => (c.requesterId === requesterId ? { ...c, status: action } : c))
        );
        toast.add({
          title: action === "ACCEPTED" ? "Connection accepted!" : "Request declined",
          type: action === "ACCEPTED" ? "success" : "info",
        });
      } else {
        toast.add({ title: "Action failed. Please try again.", type: "error" });
      }
    } catch {
      toast.add({ title: "Network error. Please try again.", type: "error" });
    } finally {
      setRespondingId(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
          <p className="text-muted-foreground mt-1">Manage your learning partners, mentors, and collaborators.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Correctly identify which side is "me" using myDbId
  const getPeer = (c: Connection): ConnectionUser =>
    c.requesterId === myDbId ? c.receiver : c.requester;

  const accepted = connections.filter((c) => c.status === "ACCEPTED");
  // Incoming = I am the receiver AND it's pending
  const incoming = connections.filter(
    (c) => c.status === "PENDING" && c.receiverId === myDbId
  );
  // Outgoing = I am the requester AND it's pending
  const outgoing = connections.filter(
    (c) => c.status === "PENDING" && c.requesterId === myDbId
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
        <p className="text-muted-foreground mt-1">
          Manage your learning partners, mentors, and collaborators.
        </p>
      </div>

      <Tabs defaultValue="connected">
        <TabsList className="w-full justify-start overflow-x-auto h-auto flex-nowrap shrink-0">
          <TabsTrigger value="connected" className="shrink-0">
            <UserCheck className="w-4 h-4 mr-2" />
            Connected ({accepted.length})
          </TabsTrigger>
          <TabsTrigger value="incoming" className="shrink-0">
            <Clock className="w-4 h-4 mr-2" />
            Requests ({incoming.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="shrink-0">
            <Loader2 className="w-4 h-4 mr-2" />
            Sent ({outgoing.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="mt-4">
          {accepted.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
                <Users className="w-12 h-12 opacity-20" />
                <p className="font-medium">No collaborators found</p>
                <p className="text-muted-foreground max-w-md">
                  We couldn&apos;t find anyone matching your search criteria. Try adjusting your filters, searching for different skills, or check back later!
                </p>
                <Link href="/discover">
                  <Button>Discover People</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accepted.map((c) => {
                const peer = getPeer(c);
                return (
                  <Link key={c.id} href={`/profile/${peer.id}`}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={peer.avatarUrl || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {peer.name?.charAt(0)?.toUpperCase() ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{peer.name || "Anonymous"}</p>
                          {peer.profile && (
                            <p className="text-sm text-muted-foreground truncate">
                              {[peer.profile.branch, peer.profile.college].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="shrink-0">Connected</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="incoming" className="mt-4">
          {incoming.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <Clock className="w-12 h-12 opacity-20" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-sm">You&apos;ll see connection requests, team invites, and AI matches here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incoming.map((c) => {
                const peer = c.requester;
                const isResponding = respondingId === peer.id;
                return (
                  <Card key={c.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={peer.avatarUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {peer.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{peer.name || "Anonymous"}</p>
                        {peer.profile && (
                          <p className="text-sm text-muted-foreground truncate">
                            {[peer.profile.branch, peer.profile.college].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          disabled={isResponding}
                          onClick={() => respond(peer.id, "ACCEPTED")}
                        >
                          {isResponding ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isResponding}
                          onClick={() => respond(peer.id, "REJECTED")}
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          {outgoing.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="w-12 h-12 opacity-20" />
                <p className="font-medium">No pending sent requests</p>
                <p className="text-sm text-center text-muted-foreground max-w-sm mt-1 mb-2">
                  You haven&apos;t sent any connection requests recently. Head over to Discover to find collaborators!
                </p>
                <Link href="/discover">
                  <Button variant="outline">Find Collaborators</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outgoing.map((c) => {
                const peer = c.receiver;
                return (
                  <Card key={c.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={peer.avatarUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {peer.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{peer.name || "Anonymous"}</p>
                        {peer.profile && (
                          <p className="text-sm text-muted-foreground truncate">
                            {[peer.profile.branch, peer.profile.college].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-muted-foreground shrink-0">Pending</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
