import { Skeleton } from "@/components/ui/skeleton";

export default function PassportLoading() {
  return (
    <div className="container max-w-3xl space-y-6 py-6 md:py-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <div className="flex justify-center">
        <Skeleton className="h-96 w-full max-w-sm rounded-2xl" />
      </div>

      <div className="mx-auto grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 rounded-md" />
        ))}
      </div>
    </div>
  );
}
