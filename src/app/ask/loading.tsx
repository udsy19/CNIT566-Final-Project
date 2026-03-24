export default function AskLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* TopBar skeleton */}
      <div className="h-14 border-b border-border/40 bg-background/80 flex items-center px-6">
        <div className="h-4 w-24 bg-muted rounded-full animate-pulse" />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-muted-foreground">[loading chat]</p>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="border-t border-border/40 p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <div className="flex-1 h-11 bg-muted rounded-full animate-pulse" />
          <div className="w-11 h-11 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
