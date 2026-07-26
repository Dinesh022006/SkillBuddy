import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border rounded-xl p-6 bg-card flex flex-col space-y-4 h-full">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1 mr-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-12 w-full flex-1" />
            <div className="flex items-center justify-between pt-4">
              <Skeleton className="h-4 w-24" />
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-8 w-8 rounded-full ring-2 ring-background" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
