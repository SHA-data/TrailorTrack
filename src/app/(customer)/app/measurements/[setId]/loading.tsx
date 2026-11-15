import { Skeleton } from "@/components/ui/skeleton";

export default function MeasurementDetailLoading() {
  return (
    <div className="container max-w-4xl space-y-6 py-6 md:py-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      <div className="bg-card space-y-4 rounded-xl border p-6">
        <Skeleton className="h-6 w-36" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-1 rounded-lg border p-3">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
