import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col h-full animate-in fade-in duration-500">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="flex-1 p-4 space-y-6 overflow-hidden">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className="h-16 w-64 rounded-2xl rounded-tl-none" />
        </div>
        <div className="flex items-start gap-3 flex-row-reverse">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className="h-12 w-48 rounded-2xl rounded-tr-none" />
        </div>
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className="h-20 w-72 rounded-2xl rounded-tl-none" />
        </div>
      </div>
      <div className="p-4 border-t">
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
