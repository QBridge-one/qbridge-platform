// ============================================================
// app/select-workspace/loading.tsx
// Brief spinner while we decide which plane to send the user to.
// ============================================================

export default function SelectWorkspaceLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <p className="text-xs uppercase tracking-wide">Resolving workspace…</p>
      </div>
    </main>
  );
}
