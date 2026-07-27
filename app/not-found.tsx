import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-muted p-6 rounded-full mb-6">
        <SearchX className="w-16 h-16 text-muted-foreground" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-2">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md text-lg">
        We couldn&apos;t find the page you were looking for. It might have been removed, renamed, or didn&apos;t exist in the first place.
      </p>
      <div className="flex gap-4">
        <Link href="/dashboard">
          <Button variant="default" size="lg">
            Return to Dashboard
          </Button>
        </Link>
        <Link href="/discover">
          <Button variant="outline" size="lg">
            Browse Connections
          </Button>
        </Link>
      </div>
    </div>
  );
}
