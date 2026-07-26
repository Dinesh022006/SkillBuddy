"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, UserPlus, Check, Loader2, Sparkles, BrainCircuit, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import Link from "next/link"

interface DiscoverUser {
  id: string;
  name?: string | null;
  firstName?: string | null;
  avatarUrl?: string | null;
  profile?: {
    bio?: string | null;
    headline?: string | null;
    college?: string | null;
    branch?: string | null;
    skills?: { skill: { id: string, name: string } }[];
  } | null;
  recommendationsFor?: { aiInsight?: { matchSummary?: string, sharedSkills?: string[], complementarySkills?: string[], collaborationSuggestions?: string[] } | null, score?: number | null, updatedAt?: string | Date | null }[];
  connectionsReceived?: unknown[];
  connectionsInitiated?: unknown[];
  [key: string]: unknown;
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [generatingMatch, setGeneratingMatch] = useState<Record<string, boolean>>({});

  const fetchUsers = useCallback(async (pageNum: number, search: string, reset: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      const res = await fetch(`/api/discover?page=${pageNum}&limit=10&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      setUsers(prev => reset ? data.data : [...prev, ...data.data]);
      setHasMore(data.meta.page < data.meta.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1, searchQuery, true);
      setPage(1);
    }, 500); // debounce
    return () => clearTimeout(timer);
  }, [searchQuery, fetchUsers]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage, searchQuery, false);
  };

  const handleConnect = async (userId: string) => {
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId })
      });
      if (res.ok) {
        toast.add({ title: "Connection request sent!", type: "success" });
        // Update local state to reflect requested status
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, connectionsReceived: [{ status: "PENDING" }] } 
            : u
        ));
      }
    } catch (e) {
      console.error(e);
      toast.add({ title: "Failed to send connection request.", type: "error" });
    }
  };

  const generateAIInsight = async (targetUserId: string) => {
    try {
      setGeneratingMatch(prev => ({ ...prev, [targetUserId]: true }));
      const res = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, forceRefresh: true })
      });
      
      if (res.ok) {
        const newRec = await res.json();
        setUsers(users.map(u => 
          u.id === targetUserId 
            ? { ...u, recommendationsFor: [newRec] } 
            : u
        ));
      } else {
        const text = await res.text();
        toast.add({ title: `Error generating insight: ${text}`, type: "error" });
      }
    } catch (e) {
      console.error(e);
      toast.add({ title: "Failed to generate AI insights.", type: "error" });
    } finally {
      setGeneratingMatch(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discover Collaborators</h1>
          <p className="text-muted-foreground mt-1">AI-powered matches based on your skills and goals.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search by skills, college, or name..." 
          className="pl-10 py-6 text-lg rounded-xl bg-card border-border/50 shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && page === 1 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 pt-4 animate-in fade-in duration-500">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-xl border p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 pt-4">
          {users.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in duration-500">
              <div className="bg-primary/5 p-6 rounded-full mb-6 relative">
                <Users className="h-12 w-12 text-primary/40" />
                <Search className="h-6 w-6 text-primary absolute bottom-4 right-4 bg-background rounded-full p-0.5" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">No collaborators found</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                We couldn&apos;t find anyone matching your search criteria. Try adjusting your filters, searching for different skills, or check back later!
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
            </div>
          ) : (
            users.map((user) => {
              const rec = user.recommendationsFor?.[0];
              const aiInsight = rec?.aiInsight;
              const hasRequested = (user.connectionsReceived?.length || 0) > 0 || (user.connectionsInitiated?.length || 0) > 0;
              const isGenerating = generatingMatch[user.id];
              const nameStr = user.name || "Anonymous User";
              const initial = nameStr.charAt(0);

              return (
                <Card key={user.id} className="flex flex-col hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 transition-all duration-300 rounded-xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${user.id}`} className="shrink-0 hover:opacity-80 transition-opacity">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatarUrl || ""} />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl">
                              {initial}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/profile/${user.id}`} className="hover:underline">
                            <CardTitle className="text-lg truncate">{nameStr}</CardTitle>
                          </Link>
                          <CardDescription className="line-clamp-1">{user.profile?.college || "No College"} • {user.profile?.branch || "No Branch"}</CardDescription>
                        </div>
                      </div>
                      {rec ? (
                        <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 shrink-0">
                          {rec.score}% Match
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0 text-xs text-muted-foreground">
                          No Match Score
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    
                    {/* AI Insight Section */}
                    <div className="rounded-lg bg-accent/5 p-4 border border-accent/10 relative h-full flex flex-col">
                      <BrainCircuit className="absolute top-2 right-2 h-4 w-4 text-accent/40" />
                      {aiInsight ? (
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 border-b border-accent/10 pb-3">
                            <div className="bg-primary/10 text-primary font-bold text-xl px-3 py-2 rounded-lg flex flex-col items-center justify-center">
                              <span>{rec.score}%</span>
                              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">Match</span>
                            </div>
                            <p className="text-sm text-foreground/90 italic flex-1">&quot;{aiInsight.matchSummary}&quot;</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {(aiInsight.sharedSkills?.length || 0) > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1">
                                  <Check className="h-3 w-3 text-green-500" /> Shared Skills
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {aiInsight.sharedSkills!.slice(0, 3).map((s: string) => (
                                    <Badge key={s} variant="outline" className="text-[10px] bg-background/50">{s}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(aiInsight?.complementarySkills?.length ?? 0) > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-amber-500" /> Complementary
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {aiInsight.complementarySkills!.slice(0, 3).map((s: string) => (
                                    <Badge key={s} variant="outline" className="text-[10px] bg-background/50">{s}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {(aiInsight.collaborationSuggestions?.length || 0) > 0 && (
                            <div className="bg-background/50 rounded p-2 border border-border/50">
                              <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Suggested Collaboration</p>
                              <p className="text-xs text-foreground/90 flex items-start gap-1.5">
                                <span className="text-amber-500 mt-0.5">💡</span> 
                                {aiInsight.collaborationSuggestions![0]}
                              </p>
                            </div>
                          )}
                          {rec.updatedAt && (
                            <p className="text-[9px] text-muted-foreground/50 text-right">Analyzed {new Date(rec.updatedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      ) : isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                          <Loader2 className="h-5 w-5 animate-spin text-accent" />
                          <p className="text-xs text-muted-foreground">Generating AI Match...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 space-y-3">
                          <p className="text-xs text-center text-muted-foreground flex-1 flex items-center justify-center">Discover how you and {nameStr} can collaborate.</p>
                          <Button variant="outline" size="sm" onClick={() => generateAIInsight(user.id)} className="h-8 text-xs">
                            ✨ Analyze Compatibility
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Skills</div>
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
                      onClick={() => handleConnect(user.id)}
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
            })
          )}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center pt-8">
          <Button variant="outline" onClick={loadMore}>Load More</Button>
        </div>
      )}
      
      {loading && page > 1 && (
        <div className="flex justify-center pt-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  )
}
