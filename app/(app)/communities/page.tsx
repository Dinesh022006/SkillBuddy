import { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users } from "lucide-react";
import CreateCommunityDialog from "./CreateCommunityDialog";

export const metadata: Metadata = {
  title: "Communities - SkillBuddy AI",
  description: "Find and join communities.",
};



export default async function CommunitiesPage() {
  const communities = await prisma.community.findMany({
    include: {
      _count: {
        select: { members: true, posts: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communities</h1>
          <p className="text-muted-foreground mt-1">Join communities to connect with like-minded peers.</p>
        </div>
        <CreateCommunityDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {communities.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in duration-500">
            <div className="bg-primary/5 p-6 rounded-full mb-6 relative">
              <Users className="h-12 w-12 text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight mb-2">No communities yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              There are no communities available right now. Be the first to start a new community and gather like-minded peers!
            </p>
          </div>
        ) : (
          communities.map(community => (
            <Link key={community.id} href={`/communities/${community.id}`} className="block h-full">
              <div className="border rounded-xl p-6 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 bg-card h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{community.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {community._count.members} Members • {community._count.posts} Posts
                    </p>
                  </div>
                </div>
                {community.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {community.description}
                  </p>
                )}
                {community.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {community.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
