import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, MessagesSquare } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

export const metadata: Metadata = {
  title: "Team Details - SkillBuddy AI",
};

export default async function TeamDetailsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  if (!teamId) notFound();

  const [clerkUser, team] = await Promise.all([
    currentUser(),
    prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { include: { user: true } },
        chatRoom: true
      }
    })
  ]);

  if (!team) notFound();

  const dbUser = clerkUser ? await prisma.user.findUnique({ where: { clerkId: clerkUser.id } }) : null;
  const isMember = dbUser ? team.members.some(m => m.userId === dbUser.id) : false;

  return (
    <div className="w-full">
      <div className="bg-card border rounded-lg p-8 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{team.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {team.members.length} / {team.maxMembers} Members
              </span>
              {team.hackathonName && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm font-medium">
                  {team.hackathonName}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isMember ? (
              team.chatRoomId ? (
                <Link href={`/chat/${team.chatRoomId}`}>
                  <Button>
                    <MessagesSquare className="h-4 w-4 mr-2" />
                    Team Chat
                  </Button>
                </Link>
              ) : null
            ) : (
              <Button>Request to Join</Button>
            )}
          </div>
        </div>

        {team.description && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-muted-foreground">{team.description}</p>
          </div>
        )}

        {team.requiredSkills.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {team.requiredSkills.map(skill => (
                <span key={skill} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Members</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.members.map(member => (
            <Link key={member.id} href={`/profile/${member.userId}`} className="block">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors">
                <UserAvatar 
                  userId={member.userId} 
                  name={member.user.name} 
                  imageUrl={member.user.avatarUrl} 
                  size="lg" 
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{member.user.name || "Anonymous User"}</p>
                  <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
