export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* TopBar skeleton */}
      <div className="h-14 -mx-6 -mt-6 border-b border-border/40 bg-background/80 flex items-center px-6">
        <div className="h-4 w-24 bg-muted rounded-full animate-pulse" />
      </div>

      {/* Briefing skeleton */}
      <div className="p-6 rounded-2xl border border-border bg-background">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 bg-muted rounded-full animate-pulse" />
            <div className="h-2.5 w-16 bg-muted rounded-full animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded-full w-3/4 animate-pulse" />
          <div className="h-3 bg-muted rounded-full w-1/2 animate-pulse" />
          <div className="h-3 bg-muted rounded-full w-5/6 animate-pulse" />
        </div>
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-border bg-background">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-muted animate-pulse" />
              <div className="h-3.5 w-32 bg-muted rounded-full animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-3 bg-muted rounded-full w-2/3 animate-pulse" />
                  <div className="h-3 bg-muted rounded-full w-16 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Announcements skeleton */}
      <div className="p-6 rounded-2xl border border-border bg-background">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-muted animate-pulse" />
          <div className="h-3.5 w-40 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="border-b border-border/40 pb-3 last:border-0">
              <div className="h-3.5 bg-muted rounded-full w-1/2 animate-pulse mb-1" />
              <div className="h-2.5 bg-muted rounded-full w-24 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
