import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <Skeleton className="w-16 h-16 rounded-full mx-auto" />
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-5 w-48 mx-auto" />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/30">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-card">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="text-right space-y-2 shrink-0 pl-4">
                <Skeleton className="h-6 w-24 ml-auto" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
