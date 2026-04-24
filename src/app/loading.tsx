// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-mono text-muted-foreground">[loading]</p>
      </div>
    </div>
  );
}
