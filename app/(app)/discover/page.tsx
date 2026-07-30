"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, Sparkles, Loader2, Users } from "lucide-react"
import { RecommendationSection } from "@/components/discover/RecommendationSection"
import { UserCard, DiscoverUser } from "@/components/discover/UserCard"
import { Button } from "@/components/ui/button"

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<DiscoverUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedSearch) {
      return;
    }
    
    const doSearch = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/discover?search=${encodeURIComponent(debouncedSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.data);
          setHasSearched(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    };
    
    doSearch();
  }, [debouncedSearch]);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent/5 border px-6 py-12 md:py-20 text-center flex flex-col items-center justify-center">
        <Sparkles className="absolute top-8 left-12 h-8 w-8 text-amber-500/30 animate-pulse" />
        <Sparkles className="absolute bottom-12 right-16 h-12 w-12 text-primary/20 animate-pulse delay-700" />
        
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
          Discover Your Network
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Find the perfect collaborators based on your skills, goals, and interests.
        </p>

        <div className="w-full max-w-3xl relative z-10 group">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-colors -z-10 opacity-50"></div>
          <Search className="absolute left-4 top-4 h-6 w-6 text-muted-foreground" />
          <Input 
            placeholder="Search students, skills, interests, colleges, or usernames..." 
            className="pl-14 py-8 text-lg rounded-2xl bg-card border-border/50 shadow-sm focus-visible:ring-primary focus-visible:ring-2 focus-visible:border-primary transition-all text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {debouncedSearch ? (
        // Search Results State
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Search Results</h2>
            {isSearching && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </div>
          
          {isSearching ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 animate-in fade-in duration-500">
               {/* Skeleton Loaders */}
               {[...Array(5)].map((_, i) => (
                <div key={i} className="h-[250px] bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border rounded-2xl border-dashed">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">No matching students found.</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Try adjusting your search terms, focusing on specific skills or colleges.
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {searchResults.map(user => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Recommendation Sections State
        <div className="space-y-12">
          <RecommendationSection 
            title="⭐ AI Recommended" 
            description="Our smartest matches based on your comprehensive profile compatibility."
            section="ai_recommended" 
          />
          
          <RecommendationSection 
            title="🔥 Based on Your Skills" 
            description="Students who share or complement your technical stack."
            section="similar_skills" 
          />
          
          <RecommendationSection 
            title="📚 Based on Your Learning Goals" 
            description="Peers learning the exact same technologies you are."
            section="similar_goals" 
          />
          
          <RecommendationSection 
            title="👥 Based on Your Communities" 
            description="Active members from the communities you've joined."
            section="shared_communities" 
          />
          
          <RecommendationSection 
            title="🏆 Top Contributors" 
            description="Outstanding members making a difference in the network."
            section="top_contributors" 
          />
        </div>
      )}
    </div>
  )
}
