import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Code, Briefcase, MapPin, Check, BookOpen } from "lucide-react";
import Link from "next/link";
import ConnectButton from "./ConnectButton";

export const metadata: Metadata = {
  title: "Profile - SkillBuddy AI",
};

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!userId) notFound();

  const [clerkUser, targetUser] = await Promise.all([
    currentUser(),
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: { include: { skill: true } },
            learningGoals: { include: { skill: true } },
            learningStreak: true,
            userBadges: { include: { badge: true } },
          }
        }
      }
    })
  ]);

  if (!targetUser) notFound();

  const currentDbUser = clerkUser ? await prisma.user.findUnique({ where: { clerkId: clerkUser.id } }) : null;

  const isCurrentUser = currentDbUser?.id === targetUser.id;

  // Check connection status if not current user
  let connectionStatus = null;
  if (currentDbUser && !isCurrentUser) {
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: currentDbUser.id, receiverId: targetUser.id },
          { requesterId: targetUser.id, receiverId: currentDbUser.id }
        ]
      }
    });
    connectionStatus = connection?.status || "NONE";
  }

  const name = targetUser.name || targetUser.firstName || "Anonymous User";
  const initial = name.charAt(0).toUpperCase();

  const codingFields = [
    { name: "GitHub", url: targetUser.profile?.githubUrl, icon: Code },
    { name: "LinkedIn", url: targetUser.profile?.linkedinUrl, icon: Briefcase },
    { name: "LeetCode", url: targetUser.profile?.leetcodeUrl, icon: Code, color: "text-orange-500" },
    { name: "CodeChef", url: targetUser.profile?.codechefUrl, icon: Code, color: "text-amber-600" },
    { name: "Codeforces", url: targetUser.profile?.codeforcesUrl, icon: Code, color: "text-red-500" },
    { name: "HackerRank", url: targetUser.profile?.hackerrankUrl, icon: Code, color: "text-green-500" },
    { name: "HackerEarth", url: targetUser.profile?.hackerearthUrl, icon: Code, color: "text-blue-500" },
    { name: "Devfolio", url: targetUser.profile?.devfolioUrl, icon: Code, color: "text-cyan-500" },
    { name: "Behance", url: targetUser.profile?.behanceUrl, icon: Code, color: "text-purple-500" },
  ].filter(f => f.url && f.url.trim() !== "");

  const isVerified = targetUser.profile?.githubUrl && codingFields.length >= 2;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8">
      {/* Header Section */}
      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />
        <CardContent className="relative pt-0 sm:pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:-mt-12 -mt-16 mb-4">
            <UserAvatar 
              userId={targetUser.id} 
              name={name} 
              imageUrl={targetUser.avatarUrl} 
              size="3xl" 
              className="border-4 border-background"
            />
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-3xl font-bold tracking-tight truncate flex items-center justify-center sm:justify-start gap-2">
                {name}
                {isVerified && (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 px-1 py-0 h-5" title="Verified Profile">
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground truncate text-lg">
                {[targetUser.profile?.branch, targetUser.profile?.college].filter(Boolean).join(" • ") || "Student"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 mt-4 sm:mt-0">
              {isCurrentUser ? (
                <Link href="/profile">
                  <Button variant="outline">Edit Profile</Button>
                </Link>
              ) : currentDbUser ? (
                <ConnectButton 
                  targetUserId={targetUser.id} 
                  initialStatus={connectionStatus} 
                />
              ) : (
                <Link href="/sign-in">
                  <Button>Sign in to Connect</Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-6 text-sm text-muted-foreground">
            {targetUser.profile?.availability && (
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full">
                <MapPin className="h-4 w-4" /> Available: {targetUser.profile.availability}
              </span>
            )}
            {targetUser.profile?.careerGoal && (
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full">
                <Briefcase className="h-4 w-4" /> Looking For: {targetUser.profile.careerGoal}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground font-medium">Level</span>
                <span className="font-bold text-lg">{targetUser.profile?.level || 1}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground font-medium">XP</span>
                <span className="font-bold text-primary text-lg">{targetUser.profile?.xp || 0}</span>
              </div>
              {targetUser.profile?.learningStreak && targetUser.profile.learningStreak.currentStreak > 0 && (
                <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" /> Streak
                  </span>
                  <span className="font-bold text-orange-500 text-lg">{targetUser.profile.learningStreak.currentStreak} days</span>
                </div>
              )}
            </CardContent>
          </Card>

          {codingFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Links & Profiles</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {codingFields.map((field, i) => (
                  <a key={i} href={field.url as string} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center gap-3 p-2 hover:bg-secondary/50 rounded-md transition-colors text-sm font-medium">
                    <field.icon className={`h-4 w-4 ${field.color || "text-foreground"}`} />
                    {field.name}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          {targetUser.profile?.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {targetUser.profile.bio}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Technologies {name} knows</CardDescription>
            </CardHeader>
            <CardContent>
              {targetUser.profile?.skills && targetUser.profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {targetUser.profile.skills.map(s => (
                    <Badge key={s.skill.id} variant="secondary" className="px-3 py-1.5 text-sm">
                      {s.skill.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No skills added yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Goals</CardTitle>
              <CardDescription>What {name} is currently learning</CardDescription>
            </CardHeader>
            <CardContent>
              {targetUser.profile?.learningGoals && targetUser.profile.learningGoals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {targetUser.profile.learningGoals.map(g => (
                    <Badge key={g.skill.id} variant="outline" className="px-3 py-1.5 text-sm border-primary/30 text-primary">
                      <BookOpen className="h-3 w-3 mr-1.5" />
                      {g.skill.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No learning goals added yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
