import { Skeleton } from "@/components/ui/skeleton";

export default function ConsentedCustomerLoading() {
  return (
    <div className="container max-w-4xl space-y-6 py-6 md:py-8">
      <Skeleton className="h-8 w-36" />

      <div className="bg-card space-y-4 rounded-xl border p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div className="space-y-2">
            <Skeleton className="h-8 w-60" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </div>

      <div className="flex gap-2 pb-2">
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card space-y-3 rounded-xl border p-5">
            <Skeleton className="h-6 w-32" />
            <div className="bg-muted/20 grid grid-cols-3 gap-2 rounded-lg p-3">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <Skeleton key={j} className="h-10 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
