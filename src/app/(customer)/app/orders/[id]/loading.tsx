import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerOrderDetailLoading() {
  return (
    <div className="container max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-6">
            <Skeleton className="h-20 w-full" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-40 w-full" />
          </Card>
        </div>
        <div>
          <Card className="p-6">
            <Skeleton className="h-48 w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
