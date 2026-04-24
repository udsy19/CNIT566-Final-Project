// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

export default function CourseLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* TopBar skeleton */}
      <div className="h-14 -mx-6 -mt-6 border-b border-border/40 bg-background/80 flex items-center px-6">
        <div className="h-4 w-40 bg-muted rounded-full animate-pulse" />
      </div>

      {/* Course header skeleton */}
      <div className="p-6 rounded-2xl border border-border bg-background">
        <div className="h-2.5 w-16 bg-muted rounded-full animate-pulse mb-3" />
        <div className="h-7 w-48 bg-muted rounded-full animate-pulse mb-4" />
        <div className="flex gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-8 w-12 bg-muted rounded animate-pulse mb-1" />
              <div className="h-2.5 w-16 bg-muted rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-24 bg-muted rounded-full animate-pulse" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="p-6 rounded-2xl border border-border bg-background">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="flex-1">
                <div className="h-3.5 bg-muted rounded-full w-2/3 animate-pulse mb-1" />
                <div className="h-2.5 bg-muted rounded-full w-1/3 animate-pulse" />
              </div>
              <div className="h-3 bg-muted rounded-full w-16 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
