"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users, MessageSquare, BrainCircuit,
  Trophy, Medal, Flame, UserCheck, Network, Briefcase,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalConnections: number;
  pendingRequests: number;
  communitiesJoined: number;
  teamsJoined: number;
  activeChats: number;
  messagesSent: number;
  aiMatchesGenerated: number;
  profileCompletion: number;
  xp: number;
  level: number;
  weeklyActivity: number;
  monthlyActivity: number;
  currentStreak: number;
  longestStreak: number;
}

export default function DashboardClient({ userName }: { userName: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setStats(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-[250px] w-full rounded-2xl" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-muted-foreground p-8">Error loading dashboard.</div>;
  }

  const metricCards = [
    {
      label: "Connections",
      value: stats.totalConnections,
      sub: `${stats.pendingRequests} pending`,
      icon: UserCheck,
      href: "/connections",
      color: "text-blue-500",
    },
    {
      label: "Communities",
      value: stats.communitiesJoined,
      sub: "communities joined",
      icon: Network,
      href: "/communities",
      color: "text-green-500",
    },
    {
      label: "Teams",
      value: stats.teamsJoined,
      sub: "teams joined",
      icon: Briefcase,
      href: "/teams",
      color: "text-orange-500",
    },
    {
      label: "AI Matches",
      value: stats.aiMatchesGenerated,
      sub: "recommendations",
      icon: BrainCircuit,
      href: "/discover",
      color: "text-purple-500",
    },
    {
      label: "Messages",
      value: stats.messagesSent,
      sub: `across ${stats.activeChats} chats`,
      icon: MessageSquare,
      href: "/chat",
      color: "text-pink-500",
    },
    {
      label: "This Week",
      value: stats.weeklyActivity,
      sub: `${stats.monthlyActivity} this month`,
      icon: Users,
      href: "/profile",
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* XP / Level Hero Card */}
      <Card className="bg-gradient-to-br from-primary/15 via-accent/5 to-background border-primary/20 relative overflow-hidden rounded-2xl shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform translate-x-4 -translate-y-4">
          <Trophy className="w-64 h-64 text-primary" />
        </div>
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            Welcome back, {userName} 👋
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-base px-3 py-1">
              Level {stats.level}
            </Badge>
          </CardTitle>
          <CardDescription className="text-base text-foreground/80 mt-2">
            Continue building your network and discover new matches. You have <strong className="text-primary">{stats.xp} XP</strong>. Keep collaborating to level up!
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 relative z-10">
          {/* Profile completion */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Profile Completion</span>
              <span className="font-bold text-primary">{stats.profileCompletion}%</span>
            </div>
            <Progress value={stats.profileCompletion} className="h-3 bg-primary/10 transition-all duration-1000 ease-in-out" />
            {stats.profileCompletion < 100 && (
              <Link href="/profile" className="inline-block mt-4">
                <Button size="sm" className="transition-transform hover:scale-105">Complete Profile (+100 XP)</Button>
              </Link>
            )}
          </div>

          {/* Streak + leaderboard */}
          <div className="flex items-center gap-4 bg-muted/30 rounded-xl p-4">
            <div className={`p-3 rounded-full ${stats.currentStreak > 0 ? "bg-orange-500/20 text-orange-500" : "bg-muted text-muted-foreground"}`}>
              <Flame className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Learning Streak</p>
              {stats.currentStreak > 0 ? (
                <p className="text-2xl font-black">{stats.currentStreak} day{stats.currentStreak !== 1 ? "s" : ""} 🔥</p>
              ) : (
                <p className="text-lg font-semibold text-muted-foreground">No active streak</p>
              )}
              {stats.longestStreak > 0 && (
                <p className="text-xs text-muted-foreground">Best: {stats.longestStreak} days</p>
              )}
            </div>
            <Link href="/leaderboard" className="mt-2 sm:mt-0">
              <Button variant="outline" size="sm" className="transition-transform hover:scale-105">
                <Medal className="w-4 h-4 mr-2" /> Leaderboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metricCards.map(({ label, value, sub, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <Card className="hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 transition-all duration-300 cursor-pointer h-full flex flex-col rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className={`h-5 w-5 ${color} opacity-80`} />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump right in</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/discover">
            <Button variant="default">
              <BrainCircuit className="w-4 h-4 mr-2" /> Find AI Matches
            </Button>
          </Link>
          <Link href="/communities">
            <Button variant="outline">
              <Network className="w-4 h-4 mr-2" /> Browse Communities
            </Button>
          </Link>
          <Link href="/teams">
            <Button variant="outline">
              <Briefcase className="w-4 h-4 mr-2" /> Find a Team
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" /> Open Chat
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
