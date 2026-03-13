import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

function AgentCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="mt-2 h-4 w-3/4" />
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-1.5 h-3 w-2/3" />
      </CardContent>
      <CardFooter className="flex items-center gap-3 px-4 pb-4 pt-2">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
      </CardFooter>
    </Card>
  )
}

export function AgentResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <AgentCardSkeleton key={i} />
      ))}
    </div>
  )
}
