"use client"

import { useEffect, useState, useRef } from "react"
import { DiscoverUser, UserCard } from "./UserCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface RecommendationSectionProps {
  title: string;
  description?: string;
  section: string;
  emptyMessage?: string;
}

export function RecommendationSection({ title, description, section }: RecommendationSectionProps) {
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/discover?section=${section}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };

    if (containerRef.current) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !hasFetched) {
          fetchData();
        }
      }, { rootMargin: "200px" });
      observer.observe(containerRef.current);
    }
    return () => observer?.disconnect();
  }, [hasFetched, section]);

  if (hasFetched && users.length === 0) {
    return null; // Don't show empty sections to keep UI clean, or show the empty state if required.
  }

  return (
    <div ref={containerRef} className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
        </div>
        {users.length > 0 && (
          <Button variant="ghost" size="sm" className="hidden sm:flex group">
            See all <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 animate-in fade-in duration-500">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-xl border p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-[150px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}
