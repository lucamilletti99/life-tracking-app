export default function GoalDetailLoading() {
  return (
    <div className="flex-1 p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        <div className="h-44 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
