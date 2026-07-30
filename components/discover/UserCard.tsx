"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/UserAvatar"
import { Check, UserPlus, BrainCircuit, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "@/components/ui/toast"

// Generic User Interface for Discover Cards
export interface DiscoverUser {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
  profile?: {
    college?: string | null;
    branch?: string | null;
    xp?: number | null;
    skills?: { skill: { id: string, name: string } }[];
    userBadges?: { badge: { name: string } }[];
  } | null;
  matchScore?: number | null;
  aiInsight?: {
    matchSummary?: string;
    sharedSkills?: string[];
    complementarySkills?: string[];
    collaborationSuggestions?: string[];
  } | null;
  [key: string]: unknown;
}

export function UserCard({ user }: { user: DiscoverUser }) {
  const [hasRequested, setHasRequested] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [insight, setInsight] = useState(user.aiInsight);

  const nameStr = user.name || "Anonymous User";
  const initial = nameStr.charAt(0);

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: user.id })
      });
      if (res.ok) {
        toast.add({ title: "Connection request sent!", type: "success" });
        setHasRequested(true);
      }
    } catch {
      toast.add({ title: "Failed to send connection request.", type: "error" });
    }
  };

  const handleAnalyze = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id, forceRefresh: true })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.aiInsight) setInsight(data.aiInsight);
      }
    } catch {
      toast.add({ title: "Failed to analyze compatibility", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="flex flex-col h-full hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 transition-all duration-300 rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href={`/profile/${user.id}`} className="shrink-0 hover:opacity-80 transition-opacity">
              <UserAvatar 
                userId={user.id} 
                name={nameStr} 
                imageUrl={user.avatarUrl} 
                size="lg" 
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${user.id}`} className="hover:underline">
                <CardTitle className="text-lg line-clamp-2 leading-tight mb-1" title={nameStr}>
                  {nameStr}
                </CardTitle>
              </Link>
              <CardDescription className="truncate" title={`${user.profile?.college || "No College"} • ${user.profile?.branch || "No Branch"}`}>
                {user.profile?.college || "No College"} • {user.profile?.branch || "No Branch"}
              </CardDescription>
            </div>
          </div>
          <div className="shrink-0 pt-1">
            {user.matchScore !== undefined && user.matchScore !== null ? (
              <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 whitespace-nowrap">
                {Math.round(user.matchScore)}% Match
              </Badge>
            ) : user.profile?.xp ? (
              <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600 whitespace-nowrap">
                {user.profile.xp} XP
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs text-muted-foreground whitespace-nowrap">
                New
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {insight ? (
          <div className="rounded-lg bg-accent/5 p-4 border border-accent/10 relative flex flex-col gap-3">
            <BrainCircuit className="absolute top-2 right-2 h-4 w-4 text-accent/40" />
            <p className="text-sm text-foreground/90 italic flex-1">&quot;{insight.matchSummary}&quot;</p>
            <div className="grid grid-cols-2 gap-3">
              {(insight.sharedSkills?.length || 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500" /> Shared
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {insight.sharedSkills!.slice(0, 2).map((s: string) => (
                      <Badge key={s} variant="outline" className="text-[10px] bg-background/50">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(insight?.complementarySkills?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" /> Compl.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {insight.complementarySkills!.slice(0, 2).map((s: string) => (
                      <Badge key={s} variant="outline" className="text-[10px] bg-background/50">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : generating ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-2 rounded-lg bg-accent/5 border border-accent/10">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <p className="text-xs text-muted-foreground">Analyzing compatibility...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 space-y-3 rounded-lg bg-accent/5 border border-accent/10">
            <p className="text-xs text-center text-muted-foreground">Discover how you can collaborate.</p>
            <Button variant="outline" size="sm" onClick={handleAnalyze} className="h-8 text-xs">
              ✨ Analyze Match
            </Button>
          </div>
        )}
        
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Top Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {user.profile && Array.isArray(user.profile.skills) && user.profile.skills.length > 0 ? (
              user.profile.skills.slice(0, 4).map((s) => (
                <Badge key={s.skill.id} variant="outline" className="font-normal">{s.skill.name}</Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No skills added</span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4 border-t">
        <Button 
          className="flex-1 gap-2" 
          variant={hasRequested ? "secondary" : "default"}
          disabled={hasRequested}
          onClick={handleConnect}
        >
          {hasRequested ? (
            <>
              <Check className="h-4 w-4" /> Pending
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" /> Connect
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
