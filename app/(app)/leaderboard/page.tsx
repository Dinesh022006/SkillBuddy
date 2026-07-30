import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { Trophy, Flame } from "lucide-react";
import Link from "next/link";

export default async function LeaderboardPage() {
  const clerkUser = await currentUser();

  const topProfiles = await prisma.profile.findMany({
    orderBy: [{ xp: "desc" }, { level: "desc" }],
    take: 100,
    include: {
      user: true,
      learningStreak: true,
      userBadges: { include: { badge: true } },
    },
  });

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-2">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
        <h1 className="text-4xl font-extrabold tracking-tight">Global Leaderboard</h1>
        <p className="text-muted-foreground">Top contributors ranked by XP and level.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 100 Learners</CardTitle>
          <CardDescription>Rankings update as you earn XP through connections, posts, and collaboration.</CardDescription>
        </CardHeader>
        <CardContent>
          {topProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in duration-500">
              <div className="bg-primary/5 p-6 rounded-full mb-6 relative">
                <Trophy className="h-12 w-12 text-primary/40" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">No rankings yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Start collaborating, joining teams, and building your profile to earn XP and climb the leaderboard!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProfiles.map((profile, idx) => {
                const name = profile.user.name || profile.user.firstName || "Anonymous";
                const avatar = profile.user.avatarUrl;
                const initial = name.charAt(0).toUpperCase();
                const isCurrentUser = clerkUser && profile.user.clerkId === clerkUser.id;

                let rankIcon: React.ReactNode = (
                  <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                );
                if (idx === 0) rankIcon = <span className="text-2xl" title="1st Place">🥇</span>;
                else if (idx === 1) rankIcon = <span className="text-2xl" title="2nd Place">🥈</span>;
                else if (idx === 2) rankIcon = <span className="text-2xl" title="3rd Place">🥉</span>;

                return (
                  <div
                    key={profile.id}
                    className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-300 ${
                      isCurrentUser
                        ? "bg-primary/5 border-primary/30 shadow-md ring-1 ring-primary/20 scale-[1.01]"
                        : "bg-card hover:bg-muted/30 hover:shadow-md hover:-translate-y-1 hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 pr-2">
                      <div className="w-8 flex justify-center shrink-0">{rankIcon}</div>
                      <Link href={`/profile/${profile.userId}`} className="shrink-0 hover:opacity-80 transition-opacity">
                        <UserAvatar 
                          userId={profile.userId} 
                          name={name} 
                          imageUrl={avatar} 
                          size="md" 
                        />
                      </Link>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${profile.userId}`} className="hover:underline">
                            <p className="font-semibold text-sm truncate">{name}</p>
                          </Link>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">You</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile.college || profile.branch || "Student"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                      {profile.learningStreak && profile.learningStreak.currentStreak > 0 && (
                        <div className="hidden sm:flex flex-col items-center">
                          <span className="text-xs text-muted-foreground">Streak</span>
                          <span className="font-bold text-orange-500 flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {profile.learningStreak.currentStreak}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">Level</span>
                        <Badge variant="secondary" className="font-bold">{profile.level}</Badge>
                      </div>
                      <div className="flex flex-col items-center w-16 text-right">
                        <span className="text-xs text-muted-foreground">XP</span>
                        <span className="font-bold text-primary">{profile.xp.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
