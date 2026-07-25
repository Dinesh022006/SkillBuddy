import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users } from "lucide-react";
import CreateTeamDialog from "./CreateTeamDialog";

export const metadata: Metadata = {
  title: "Teams - SkillBuddy AI",
  description: "Find and collaborate with teams.",
};

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    include: {
      _count: {
        select: { members: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-1">Join a team or create your own to collaborate on projects.</p>
        </div>
        <CreateTeamDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No teams found. Be the first to create one!
          </div>
        ) : (
          teams.map(team => (
            <Link key={team.id} href={`/teams/${team.id}`} className="block">
              <div className="border rounded-lg p-6 hover:border-primary/50 hover:-translate-y-1 hover:shadow-md transition-all duration-300 bg-card h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">{team._count.members} / {team.maxMembers} Members</p>
                  </div>
                </div>
                {team.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {team.description}
                  </p>
                )}
                {team.requiredSkills.length > 0 && (
                  <div className="mt-auto pt-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Looking For</p>
                    <div className="flex flex-wrap gap-2">
                      {team.requiredSkills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                          {skill}
                        </span>
                      ))}
                      {team.requiredSkills.length > 3 && (
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                          +{team.requiredSkills.length - 3}
                        </span>
                      )}
                    </div>
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
