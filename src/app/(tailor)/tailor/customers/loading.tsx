import { Skeleton } from "@/components/ui/skeleton";

export default function TailorCustomersLoading() {
  return (
    <div className="container max-w-4xl space-y-6 py-6 md:py-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      <div className="flex gap-4 border-b pb-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-36" />
      </div>

      <Skeleton className="h-9 w-72 rounded-md" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card space-y-3 rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48" />
            <div className="flex justify-end border-t pt-2">
              <Skeleton className="h-8 w-32 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
