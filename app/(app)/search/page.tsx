
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Users, Users2, FileText, Loader2, Network } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SearchResults = {
  users: {
    id: string;
    imageUrl: string | null;
    fullName: string | null;
    username: string | null;
    profile: {
      branch: string | null;
      college: string | null;
      skills: {
        skill: {
          id: string;
          name: string;
        };
      }[];
    } | null;
  }[];
  communities: {
    id: string;
    name: string;
    description: string | null;
  }[];
  teams: {
    id: string;
    name: string;
    description: string | null;
  }[];
  posts: {
    id: string;
    content: string;
    author: {
      imageUrl: string | null;
      fullName: string | null;
    };
    community: {
      name: string;
    };
  }[];
};

export default function GlobalSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [searchTerm, setSearchTerm] = useState(query);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  // Trigger search when URL query param changes
  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    const performSearch = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=all`);
        const data = await r.json();
        if (!cancelled) setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    void performSearch();
    return () => { cancelled = true; };
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Global Search</h1>
        <p className="text-muted-foreground">Search across users, communities, teams, and posts.</p>
        <form onSubmit={handleSearch} className="flex max-w-2xl mx-auto gap-2">
          <Input 
            className="flex-1 text-lg py-6"
            placeholder="Search anything..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" size="lg" className="px-8 h-auto" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </form>
      </div>

      {loading && !results && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {results && !loading && (
        <div className="space-y-8">
          
          {/* Users */}
          {results.users?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center border-b pb-2"><Users className="mr-2" /> Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {results.users.map((user) => (
                  <Link key={user.id} href={`/profile/${user.id}`}>
                      <Card className="hover:-translate-y-1 hover:shadow-md hover:border-primary/40 transition-all duration-300 cursor-pointer h-full flex flex-col">
                        <CardContent className="flex flex-col p-5 flex-1">
                          <div className="flex items-start gap-4 mb-3">
                            <Avatar className="w-14 h-14">
                              <AvatarImage src={user.imageUrl || ""} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                {user.fullName?.charAt(0) || user.username?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-lg truncate">{user.fullName || "Anonymous"}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {[user.profile?.branch, user.profile?.college].filter(Boolean).join(" · ") || `@${user.username}`}
                              </div>
                            </div>
                          </div>
                          
                          {user.profile?.skills && user.profile.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-auto mb-4">
                              {user.profile.skills.slice(0, 3).map((s) => (
                                <span key={s.skill.id} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-[10px]">
                                  {s.skill.name}
                                </span>
                              ))}
                              {user.profile.skills.length > 3 && (
                                <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-[10px]">
                                  +{user.profile.skills.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <Button variant="outline" className="w-full mt-auto" size="sm">
                            View Profile
                          </Button>
                        </CardContent>
                      </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Communities */}
          {results.communities?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center border-b pb-2"><Network className="mr-2" /> Communities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {results.communities.map((comm) => (
                  <Link key={comm.id} href={`/communities/${comm.id}`} className="block h-full">
                    <Card className="hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 transition-all duration-300 cursor-pointer h-full rounded-xl">
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="font-bold text-lg">{comm.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">{comm.description}</div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Teams */}
          {results.teams?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center border-b pb-2"><Users2 className="mr-2" /> Teams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {results.teams.map((team) => (
                  <Link key={team.id} href={`/teams/${team.id}`} className="block h-full">
                    <Card className="hover:-translate-y-1 hover:shadow-lg hover:border-primary/40 transition-all duration-300 cursor-pointer h-full rounded-xl">
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="font-bold text-lg">{team.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">{team.description}</div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Posts */}
          {results.posts?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center border-b pb-2"><FileText className="mr-2" /> Posts</h2>
              <div className="grid grid-cols-1 gap-4">
                {results.posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center mb-2">
                        <Avatar className="w-6 h-6 mr-2">
                          <AvatarImage src={post.author.imageUrl || ""} />
                          <AvatarFallback>{post.author.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold mr-2">{post.author.fullName}</span>
                        <span className="text-xs text-muted-foreground">in {post.community.name}</span>
                      </div>
                      <p className="text-sm">{post.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {Object.values(results).every((arr) => Array.isArray(arr) && arr.length === 0) && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
              <div className="bg-primary/5 p-6 rounded-full mb-6 relative">
                <Search className="h-12 w-12 text-primary/40" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">No results found</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                We couldn&apos;t find anything matching &quot;{query}&quot;. Try adjusting your search terms or exploring the Discover page.
              </p>
              <Button variant="outline" onClick={() => {setSearchTerm(""); router.push("/search")}}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
