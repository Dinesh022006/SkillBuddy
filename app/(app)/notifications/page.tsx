"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { UserPlus, Users, Sparkles, Bell, Briefcase, Info, CheckCircle2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  CONNECTION_REQUEST: UserPlus,
  CONNECTION_ACCEPTED: CheckCircle2,
  TEAM_INVITE: Briefcase,
  COMMUNITY_INVITE: Users,
  RECOMMENDATION: Sparkles,
  SYSTEM: Info,
};

const TYPE_COLOR: Record<string, string> = {
  CONNECTION_REQUEST: "text-blue-500",
  CONNECTION_ACCEPTED: "text-green-500",
  TEAM_INVITE: "text-orange-500",
  COMMUNITY_INVITE: "text-purple-500",
  RECOMMENDATION: "text-amber-500",
  SYSTEM: "text-muted-foreground",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    setMarking(true);
    try {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.add({ title: "All notifications marked as read", type: "success" });
      }
    } catch {
      toast.add({ title: "Failed to update notifications", type: "error" });
    } finally {
      setMarking(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with your network and AI matches.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={marking}>
            {marking ? "Marking..." : `Mark all read (${unreadCount})`}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Bell className="w-12 h-12 opacity-20" />
            <p className="font-semibold text-lg text-foreground">You&apos;re all caught up!</p>
            <p className="text-sm text-center max-w-sm">When you connect with others, join teams, or receive AI recommendations, your notifications will appear here.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/discover'}>
              Find Collaborators
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = TYPE_ICON[notification.type] ?? Bell;
            const color = TYPE_COLOR[notification.type] ?? "text-muted-foreground";

            return (
              <Card
                key={notification.id}
                className={`transition-colors ${!notification.read ? "border-primary/30 bg-primary/5" : ""}`}
              >
                <CardContent className="flex items-start p-4 gap-4">
                  <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.read && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(notification.createdAt)}</p>
                  </div>
                  {notification.link && (
                    <a href={notification.link} className="shrink-0">
                      <Button variant="outline" size="sm">View</Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
