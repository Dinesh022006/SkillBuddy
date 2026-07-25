import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, MessagesSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CommunityFeed from "./CommunityFeed";

export const metadata: Metadata = {
  title: "Community Details - SkillBuddy AI",
};

export default async function CommunityDetailsPage({ params }: { params: { communityId: string } }) {
  const clerkUser = await currentUser();
  const dbUser = clerkUser ? await prisma.user.findUnique({ where: { clerkId: clerkUser.id } }) : null;

  const community = await prisma.community.findUnique({
    where: { id: params.communityId },
    include: {
      members: {
        include: { user: true }
      },
      chatRoom: true
    }
  });

  if (!community) notFound();

  const isMember = dbUser ? community.members.some((m: { userId: string }) => m.userId === dbUser.id) : false;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col md:flex-row gap-8">
      {/* Main Feed Column */}
      <div className="flex-1">
        <div className="bg-card border rounded-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">{community.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {community.members.length} Members
                </span>
                {community.visibility === "PRIVATE" && (
                  <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded text-sm font-medium">
                    Private
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isMember ? (
                community.chatRoomId ? (
                  <Link href={`/chat/${community.chatRoomId}`}>
                    <Button>
                      <MessagesSquare className="h-4 w-4 mr-2" />
                      Community Chat
                    </Button>
                  </Link>
                ) : null
              ) : (
                <Button>Join Community</Button>
              )}
            </div>
          </div>

          {community.description && (
            <div className="mb-6">
              <p className="text-muted-foreground">{community.description}</p>
            </div>
          )}

          {community.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {community.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* The Feed component handles fetching and posting */}
        <CommunityFeed communityId={community.id} isMember={isMember} />
      </div>

      {/* Sidebar: Members */}
      <div className="w-full md:w-80 flex-shrink-0">
        <h2 className="text-xl font-bold mb-4">Members</h2>
        <div className="space-y-4">
          {community.members.slice(0, 10).map(member => (
            <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={member.user.avatarUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {member.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{member.user.name || "Anonymous User"}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
            </div>
          ))}
          {community.members.length > 10 && (
            <Button variant="outline" className="w-full text-sm">View all {community.members.length} members</Button>
          )}
        </div>
      </div>
    </div>
  );
}
