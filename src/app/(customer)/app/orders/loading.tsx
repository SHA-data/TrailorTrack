import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerOrdersLoading() {
  return (
    <div className="container max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="space-y-3 p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-12 w-full" />
        </Card>
        <Card className="space-y-3 p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-12 w-full" />
        </Card>
      </div>
    </div>
  );
}
