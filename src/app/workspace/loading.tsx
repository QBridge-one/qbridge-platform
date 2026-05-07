// ============================================================
// app/workspace/loading.tsx
// Streamed fallback while the layout/page resolve auth + org data.
// ============================================================

export default function WorkspaceLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <p className="text-xs uppercase tracking-wide">Loading workspace…</p>
      </div>
    </div>
  );
}
